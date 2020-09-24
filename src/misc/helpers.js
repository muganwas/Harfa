import axios from 'axios';
import { cloneDeep } from 'lodash';
import moment from 'moment';
export const getDistance = (lat1, lon1, lat2, lon2, unit) => {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit == "K") { dist = dist * 1.609344 }
        if (unit == "N") { dist = dist * 0.8684 }
        return dist;
    }
}

export const chatDate = timestamp => {
    let result = '';
    if (timestamp && typeof timestamp === 'number')
        result = moment.unix(timestamp).local().format('DD-MM. HH:mm');
    return result;
}

export const sortByTime = (array, ascending = true) => {
    let messages = cloneDeep(array);
    if (ascending)
        messages.sort((a, b) => {
            return parseFloat(a.time) - parseFloat(b.time);
        });
    else
        messages.sort(function (a, b) {
            return parseFloat(b.time) - parseFloat(a.time);
        });
    return messages;
}

export const imageExists = async image_url => {
    let result
    if (image_url)
        await axios.get(image_url).then(res => {
            result = true;
        }).
            catch(e => {
                //console.log(e.message);
                result = false;
            });
    else result = false;
    return result;
}