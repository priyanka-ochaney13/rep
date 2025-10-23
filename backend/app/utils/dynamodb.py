"""
DynamoDB utility functions for storing user data and documentation history.

This module provides functions to interact with DynamoDB for:
- Storing user preferences
- Saving documentation generation history
- Tracking repository processing
"""

import os
import boto3
from boto3.dynamodb.conditions import Key
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import logging
import uuid

logger = logging.getLogger(__name__)

# DynamoDB Configuration - Load env vars first
from dotenv import load_dotenv
load_dotenv()

DYNAMODB_TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME', 'rep')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')

# Initialize DynamoDB client
dynamodb = boto3.resource(
    'dynamodb',
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    aws_session_token=os.getenv('AWS_SESSION_TOKEN')  # Required for Learners Lab
)

# Get table reference
table = dynamodb.Table(DYNAMODB_TABLE_NAME)


def get_current_timestamp() -> str:
    """Get current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat()


# ==================== USER PREFERENCES ====================

def save_user_preferences(user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save user preferences to DynamoDB.
    
    Args:
        user_id: Cognito user ID (sub claim from JWT)
        preferences: Dict containing user preferences
        
    Returns:
        Dict with save status
    """
    try:
        record_id = "PREFERENCES"
        
        item = {
            'userId': user_id,
            'recordId': record_id,
            'recordType': 'preferences',
            'preferences': preferences,
            'updatedAt': get_current_timestamp()
        }
        
        table.put_item(Item=item)
        
        logger.info(f"Saved preferences for user: {user_id}")
        return {'status': 'success', 'message': 'Preferences saved'}
        
    except Exception as e:
        logger.error(f"Error saving preferences: {str(e)}")
        return {'status': 'error', 'message': str(e)}


def get_user_preferences(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user preferences from DynamoDB.
    
    Args:
        user_id: Cognito user ID (sub claim from JWT)
        
    Returns:
        Dict containing user preferences or None if not found
    """
    try:
        response = table.get_item(
            Key={
                'userId': user_id,
                'recordId': 'PREFERENCES'
            }
        )
        
        item = response.get('Item')
        if item:
            return item.get('preferences', {})
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting preferences: {str(e)}")
        return None


# ==================== DOCUMENTATION HISTORY ====================

def save_documentation_record(
    user_id: str,
    repo_url: str,
    readme_content: str,
    summaries: Dict[str, str],
    metadata: Optional[Dict[str, Any]] = None,
    record_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Save a documentation generation record to DynamoDB.
    
    Args:
        user_id: Cognito user ID
        repo_url: Repository URL
        readme_content: Generated README content
        summaries: File summaries
        metadata: Additional metadata (visuals, commit info, etc.)
        record_id: Optional existing record ID for updates (if None, creates new record)
        
    Returns:
        Dict with save status and record ID
    """
    try:
        # Use existing record_id for updates, or generate new one for new records
        is_update = record_id is not None
        if not record_id:
            record_id = f"DOC#{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}#{uuid.uuid4().hex[:8]}"
        
        # Extract commit SHA and branch from metadata
        last_commit_sha = metadata.get('last_commit_sha') if metadata else None
        branch = metadata.get('branch', 'main') if metadata else 'main'
        
        item = {
            'userId': user_id,
            'recordId': record_id,
            'recordType': 'documentation',
            'repoUrl': repo_url,
            'readmeContent': readme_content,
            'summaries': summaries,
            'metadata': metadata or {},
            'lastCommitSha': last_commit_sha,
            'lastSyncedAt': get_current_timestamp(),
            'branch': branch,
            'hasUpdates': False,  # Reset flag after regeneration
            'updatedAt': get_current_timestamp()
        }
        
        # Add createdAt only for new records
        if not is_update:
            item['createdAt'] = get_current_timestamp()
        
        table.put_item(Item=item)
        
        action = "Updated" if is_update else "Saved"
        logger.info(f"{action} documentation record for user: {user_id}, repo: {repo_url}, recordId: {record_id}")
        return {
            'status': 'success',
            'message': f'Documentation record {action.lower()}',
            'recordId': record_id,
            'isUpdate': is_update
        }
        
    except Exception as e:
        logger.error(f"Error saving documentation record: {str(e)}")
        return {'status': 'error', 'message': str(e)}


def get_user_documentation_history(
    user_id: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Get documentation generation history for a user.
    
    Args:
        user_id: Cognito user ID
        limit: Maximum number of records to return
        
    Returns:
        List of documentation records
    """
    try:
        response = table.query(
            KeyConditionExpression=Key('userId').eq(user_id) & Key('recordId').begins_with('DOC#'),
            FilterExpression='recordType = :type',
            ExpressionAttributeValues={':type': 'documentation'},
            Limit=limit,
            ScanIndexForward=False  # Most recent first
        )
        
        items = response.get('Items', [])
        
        # Return full documentation records
        return items
        
    except Exception as e:
        logger.error(f"Error getting documentation history: {str(e)}")
        return []


def get_documentation_by_id(user_id: str, record_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a specific documentation record by ID.
    
    Args:
        user_id: Cognito user ID
        record_id: Record ID to retrieve
        
    Returns:
        Documentation record or None if not found
    """
    try:
        response = table.get_item(
            Key={
                'userId': user_id,
                'recordId': record_id
            }
        )
        
        return response.get('Item')
        
    except Exception as e:
        logger.error(f"Error getting documentation record: {str(e)}")
        return None


def delete_documentation_record(user_id: str, record_id: str) -> Dict[str, Any]:
    """
    Delete a documentation record.
    
    Args:
        user_id: Cognito user ID
        record_id: Record ID to delete
        
    Returns:
        Dict with deletion status
    """
    try:
        logger.info(f"Attempting to delete: userId={user_id}, recordId={record_id}")
        
        response = table.delete_item(
            Key={
                'userId': user_id,
                'recordId': record_id
            },
            ReturnValues='ALL_OLD'  # Return the deleted item to confirm it existed
        )
        
        deleted_item = response.get('Attributes')
        if deleted_item:
            logger.info(f"✅ Successfully deleted record: {record_id} for user: {user_id}")
        else:
            logger.warning(f"⚠️ No record found to delete: {record_id} for user: {user_id}")
        
        return {'status': 'success', 'message': 'Record deleted', 'deleted': bool(deleted_item)}
        
    except Exception as e:
        logger.error(f"❌ Error deleting documentation record: {str(e)}")
        logger.exception("Full traceback:")
        return {'status': 'error', 'message': str(e)}


# ==================== REPOSITORY STATS ====================

def save_repository_stats(
    user_id: str,
    repo_url: str,
    stats: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Save repository processing statistics.
    
    Args:
        user_id: Cognito user ID
        repo_url: Repository URL
        stats: Statistics (file count, processing time, etc.)
        
    Returns:
        Dict with save status
    """
    try:
        record_id = f"STATS#{repo_url.replace('/', '_').replace(':', '_')}"
        
        item = {
            'userId': user_id,
            'recordId': record_id,
            'recordType': 'stats',
            'repoUrl': repo_url,
            'stats': stats,
            'lastProcessed': get_current_timestamp()
        }
        
        table.put_item(Item=item)
        
        logger.info(f"Saved repository stats for user: {user_id}, repo: {repo_url}")
        return {'status': 'success', 'message': 'Stats saved'}
        
    except Exception as e:
        logger.error(f"Error saving repository stats: {str(e)}")
        return {'status': 'error', 'message': str(e)}


# ==================== UTILITY FUNCTIONS ====================

def mark_repo_has_updates(user_id: str, record_id: str) -> Dict[str, Any]:
    """
    Mark a repository as having available updates.
    
    Args:
        user_id: Cognito user ID
        record_id: Documentation record ID
        
    Returns:
        Dict with update status
    """
    try:
        table.update_item(
            Key={
                'userId': user_id,
                'recordId': record_id
            },
            UpdateExpression='SET hasUpdates = :val',
            ExpressionAttributeValues={
                ':val': True
            }
        )
        
        logger.info(f"Marked record {record_id} as having updates")
        return {'status': 'success', 'message': 'Repository marked as having updates'}
        
    except Exception as e:
        logger.error(f"Error marking repo updates: {str(e)}")
        return {'status': 'error', 'message': str(e)}


def get_repo_by_url(user_id: str, repo_url: str) -> Optional[Dict[str, Any]]:
    """
    Get a repository documentation record by repository URL.
    
    Args:
        user_id: Cognito user ID
        repo_url: Repository URL to search for
        
    Returns:
        Documentation record or None if not found
    """
    try:
        # Query all documentation records for this user
        response = table.query(
            KeyConditionExpression=Key('userId').eq(user_id) & Key('recordId').begins_with('DOC#'),
            FilterExpression='repoUrl = :url',
            ExpressionAttributeValues={':url': repo_url}
        )
        
        items = response.get('Items', [])
        if items:
            return items[0]  # Return the first match
        
        return None
        
    except Exception as e:
        logger.error(f"Error getting repo by URL: {str(e)}")
        return None


def test_connection() -> Dict[str, Any]:
    """
    Test DynamoDB connection and table access.
    
    Returns:
        Dict with connection status
    """
    try:
        # Try to describe the table
        response = table.meta.client.describe_table(TableName=DYNAMODB_TABLE_NAME)
        
        return {
            'status': 'success',
            'message': 'Successfully connected to DynamoDB',
            'tableName': DYNAMODB_TABLE_NAME,
            'tableStatus': response['Table']['TableStatus'],
            'itemCount': response['Table'].get('ItemCount', 0)
        }
        
    except Exception as e:
        logger.error(f"DynamoDB connection test failed: {str(e)}")
        return {
            'status': 'error',
            'message': f'Connection failed: {str(e)}'
        }
