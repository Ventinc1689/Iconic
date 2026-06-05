import json
from botocore.config import Config
from pydantic_ai import Agent
from pydantic_ai.models.bedrock import BedrockConverseModel

MODEL_ID = 'us.anthropic.claude-sonnet-4-5-20250929-v1:0'
bedrock = BedrockConverseModel(MODEL_ID)

agent = Agent(
    model = bedrock,
    system_prompt = (
        '''
            You are a knowledgable and passionate football (soccer) historian helping a fan learn more about a specific iconic soccer moment they are viewing in a gallery. You will be given context about the moment (title, players, match, competition, year, and a caption) followed by the user's question. Answer their question about this specific moment with enthusiasm and detail. Keep responses concise and exciting. If a question is unrelated to soccer or this moment, gently steer back to the moment being discussed.
        '''
    )
)

CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

def chat_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}
 
    try:
        body = json.loads(event.get('body') or '{}')
 
        question = body.get('question', '').strip()
        moment   = body.get('moment', {})
 
        if not question:
            return {
                'statusCode': 400,
                'headers': CORS_HEADERS,
                'body': json.dumps({'error': 'No question provided'}),
            }
 
        # Build context about the moment so the model can answer follow-ups
        moment_context = f'''
            Here is the iconic soccer moment the user is viewing:
                Title: {moment.get('title', 'Unknown')}
                Player(s): {moment.get('player', 'Unknown')}
                Match: {moment.get('game', 'Unknown')}
                Competition: {moment.get('competition', 'Unknown')}
                Year: {moment.get('year', 'Unknown')}
                Caption: {moment.get('caption', '')}
            The user asks: {question}
        '''
 
        result = agent.run_sync(moment_context)
 
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'reply': result.output}),
        }
 
    except Exception as e:
        print(f"Chat error: {e}")
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)}),
        }
