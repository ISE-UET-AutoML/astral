import logging
import boto3
from botocore.exceptions import ClientError
import requests    # To install: pip install requests
import json
from settings.config import BUCKET_NAME, BUCKET_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

def get_training_script_url(task):
    return create_presigned_url(f"scripts/{task.lower()}_train.zip")


def get_inference_script_url(task, deploy_type):
    return create_presigned_url(f"scripts/generic_cloud_infer_gpu.zip")

def create_presigned_url(object_name, bucket_name=BUCKET_NAME, expiration=36000):
    """Generate a presigned URL to share an S3 object

    :param bucket_name: string
    :param object_name: string
    :param expiration: Time in seconds for the presigned URL to remain valid
    :return: Presigned URL as string. If error, returns None.
    """

    # Generate a presigned URL for the S3 object
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=BUCKET_REGION
    )
    
    try:
        response = s3_client.generate_presigned_url('get_object',
                                                    Params={'Bucket': bucket_name,
                                                            'Key': object_name},
                                                    ExpiresIn=expiration)

    except ClientError as e:
        logging.error(e)
        return None

    # The response contains the presigned URL
    return response

def create_presigned_post(object_name, bucket_name=BUCKET_NAME, 
                          fields=None, conditions=None, expiration=3600):
    """Generate a presigned URL S3 POST request to upload a file

    :param bucket_name: string
    :param object_name: string
    :param fields: Dictionary of prefilled form fields
    :param conditions: List of conditions to include in the policy
    :param expiration: Time in seconds for the presigned URL to remain valid
    :return: Dictionary with the following keys:
        url: URL to post to
        fields: Dictionary of form fields and values to submit with the POST
    :return: None if error.
    """

    # Generate a presigned S3 POST URL
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=BUCKET_REGION
    )
    try:
        response = s3_client.generate_presigned_post(bucket_name,
                                                     object_name,
                                                     Fields=fields,
                                                     Conditions=conditions,
                                                     ExpiresIn=expiration)
    except ClientError as e:
        logging.error(e)
        return None

    # The response contains the presigned URL and required fields
    return response


def upload_file_to_s3(object_name):
    prefix_object_name = 'scripts/' + object_name.split('/')[-1]
    response = create_presigned_post(prefix_object_name)
    # Demonstrate how another Python program can use the presigned URL to upload a file
    with open(object_name, 'rb') as f:
        files = {'file': (object_name, f)}
        http_response = requests.post(response['url'], data=response['fields'], files=files)


    return http_response



