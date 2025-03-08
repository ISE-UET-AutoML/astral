import { API_URL, API_BASE_URL } from 'src/constants/api';
import axios from 'axios';


const updateLabel = (imageId, newLabelId) => {
    var data = {}
    data['imageId'] = imageId
    data['newLabelId'] = newLabelId
    const url = API_URL.update_label(imageId)

    return axios.post(
        url, data);

};



export { updateLabel };
