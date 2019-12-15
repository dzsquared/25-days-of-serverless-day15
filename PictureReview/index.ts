import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import * as rpn from 'request-promise-native';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    
    // 1) get environment variables
    const key_var = 'IMAGE_ANALYTICS_SUBSCRIPTION_KEY';
    const endpoint_var = 'IMAGE_ANALYTICS_ENDPOINT';

    if (!process.env[key_var]) {
        throw new Error('please set/export the following environment variable: ' + key_var);
    }
    const subscription_key = process.env[key_var];
    if (!process.env[endpoint_var]) {
        throw new Error('please set/export the following environment variable: ' + endpoint_var);
    }
    const endpoint = process.env[endpoint_var];
    const image_endpoint = endpoint + '/vision/v2.1/analyze';

    // 2) receive URL for image to analyze
    let imageInfo: ImageInfo = new ImageInfo(req.body.imgUrl);

    // 3) analyze for description and objects
    try {
        await imageDetection(image_endpoint, subscription_key, imageInfo);

        context.res = {
            // status: 200, /* Defaults to 200 */
            body: imageInfo
        };
    } catch (error) {
        context.res = {
            status: 400,
            body: error
        };
    }

};

async function imageDetection(language_endpoint: string, subscription_key: string, imageInfo: ImageInfo) {

    const params = {
        'visualFeatures': 'Objects,Description',
        'details': '',
        'language': 'en'
    };

    var options = {
        uri: language_endpoint,
        qs: params,
        body: '{"url": ' + '"' + imageInfo.imgUrl + '"}',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key' : subscription_key
        }
    };

    var imgResult = await rpn.post(options);
    console.log(imgResult);
    
    imageInfo.description = JSON.parse(imgResult).description.captions[0].text;
    imageInfo.keywords = JSON.parse(imgResult).description.tags;

}

class ImageInfo {
    public imgUrl: string;
    public description: string;
    public keywords: [string];

    constructor(imgUrl:string) {
        this.imgUrl = imgUrl;
    }
}

export default httpTrigger;
