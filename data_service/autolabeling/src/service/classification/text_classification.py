from sklearn.semi_supervised import SelfTrainingClassifier
from sklearn.svm import SVC
import random
import time
import os
import collections
from sklearn.feature_extraction.text import CountVectorizer


def get_text_res(texts):
    vectorizer = CountVectorizer()
    X = vectorizer.fit_transform(texts)
    return X.toarray()


def labeling_data_text_classification(labeled_data, unlabeled_data, label_map=dict()):
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
    x_train = get_text_res(x_train)

    x_ul = [x_train[idx] for idx, el in enumerate(y_train) if el == -1]
    x_id = [ids[idx] for idx, el in enumerate(y_train) if el == -1]
    svc = SVC(probability=True, gamma="auto")
    self_training_model = SelfTrainingClassifier(svc)
    self_training_model.fit(x_train, y_train)

    predicts = self_training_model.predict(x_ul)

    predict_label_texts = dict()

    map_id_to_hash = dict()
    for k, v in label_map.items():
        map_id_to_hash[v] = k

    for id, p in zip(x_id, predicts):
        predict_label_texts[id] = map_id_to_hash[int(p)]
    print(collections.Counter(predicts))
    return predict_label_texts
