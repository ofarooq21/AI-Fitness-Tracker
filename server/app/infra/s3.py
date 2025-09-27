
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def _client():
    """Create and return an S3 client with proper configuration."""
    try:
        return boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT,
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            config=Config(
                s3={"addressing_style": "path"},
                retries={"max_attempts": 3}
            ),
            use_ssl=settings.S3_USE_SSL,
            verify=False if not settings.S3_USE_SSL else True,
        )
    except Exception as e:
        logger.error(f"Failed to create S3 client: {e}")
        raise

def create_presigned_post(
    bucket: str, 
    key: str, 
    content_type: str = "application/octet-stream", 
    expires_in: int = 3600
) -> dict:
    """
    Create a presigned POST URL for direct file uploads.
    
    Args:
        bucket: S3 bucket name
        key: Object key in the bucket
        content_type: Expected content type of the file
        expires_in: URL expiration time in seconds
        
    Returns:
        Dictionary with 'url' and 'fields' for the presigned POST
        
    Raises:
        ClientError: If S3 operation fails
        NoCredentialsError: If credentials are invalid
    """
    try:
        s3 = _client()
        
        conditions = [
            {"bucket": bucket},
            ["starts-with", "$key", key],
            {"Content-Type": content_type},
        ]
        
        fields = {
            "Content-Type": content_type,
            "key": key
        }
        
        response = s3.generate_presigned_post(
            Bucket=bucket,
            Key=key,
            Fields=fields,
            Conditions=conditions,
            ExpiresIn=expires_in
        )
        
        return response
        
    except ClientError as e:
        logger.error(f"S3 client error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating presigned POST: {e}")
        raise
