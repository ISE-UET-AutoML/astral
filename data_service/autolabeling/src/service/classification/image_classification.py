from sklearn.semi_supervised import SelfTrainingClassifier
from sklearn.svm import SVC
import random
import time
import os
import urllib.request
from skimage.io import imread
from skimage.transform import resize
import collections


def save_image(tmp_dict, images):
    result = list()
    for img in images:
        img_file = img.split("/")[-1]
        save_path = os.path.join(tmp_dict, img_file)
        urllib.request.urlretrieve(img, save_path)
        result.append(save_path)
    # print(len(images), len(result))
    return result


def get_image_res(images):
    result = list()
    width = 150
    height = 150
    for image in images:
        im = imread(image, as_gray=True)
        # print(im.shape)
        im = resize(im, (width, height))
        im = resize(im, (1, width * height))
        # print(im[0].shape)
        result.append(im[0])
    return result


def labeling_data_images_classification(labeled_data, unlabeled_data, label_map=dict()):
    # print(labeled_data[0])
    l = [
        [el["url"], label_map[el["label_id"]["_id"]], el["_id"]] for el in labeled_data
    ]
    ul = [[el["url"], -1, el["_id"]] for el in unlabeled_data]
    data = l + ul
    random.shuffle(data)
    x_train, y_train, ids = [], [], []
    for el in data:
        x_train.append(el[0])
        y_train.append(el[1])
        ids.append(el[2])
    print(collections.Counter(y_train))
    tmp_dict = f"temp/{int(time.time())}"
    if not os.path.exists(tmp_dict):
        os.makedirs(tmp_dict)
    x_train = save_image(tmp_dict, x_train)
    x_train = get_image_res(x_train)
    x_ul = [x_train[idx] for idx, el in enumerate(y_train) if el == -1]
    x_id = [ids[idx] for idx, el in enumerate(y_train) if el == -1]
    svc = SVC(probability=True, gamma="auto")
    self_training_model = SelfTrainingClassifier(svc)
    self_training_model.fit(x_train, y_train)
    # confident thresh hold
    # confidence_scores = self_training_model.predict_proba(x_ul)
    # print(confidence_scores[:10])
    predicts = self_training_model.predict(x_ul)
    predict_label_images = dict()

    map_id_to_hash = dict()
    for k, v in label_map.items():
        map_id_to_hash[v] = k

    for id, p in zip(x_id, predicts):
        predict_label_images[id] = map_id_to_hash[int(p)]
    print(collections.Counter(predicts))
    return predict_label_images
