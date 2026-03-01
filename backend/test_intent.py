import asyncio
from services.llm_service import LLMService

async def test():
    svc = LLMService()
    result = await svc.extract_intent('Mujhe bukhar hai')
    print('Intent:', result.intent.value)
    print('Confidence:', result.confidence)
    print('Summary:', result.summary)

asyncio.run(test())
