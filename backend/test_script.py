import requests

sentence = "The fastapi semantic deduper service must safely summarize large blocks of text using openai. "
long_text = sentence * 150 # 150 * 13 words = 1950 words
print("Sending text with word count:", len(long_text.split()))

payload = {
    "url": "https://example.com/openai-test",
    "raw_text": long_text
}
try:
    response = requests.post("http://localhost:8000/process-idea", json=payload, timeout=30)
    data = response.json()
    print("Status Code:", response.status_code)
    print("Response JSON keys:", data.keys())
    
    if "content_to_use" in data:
        content_word_count = len(data["content_to_use"].split())
        print("Output word count:", content_word_count)
    else:
        print("Response:", data)
except Exception as e:
    print("Error:", e)
