import requests
from bs4 import BeautifulSoup
import os
import json

response = requests.get("http://paullab.synology.me/stock.html")

response.encoding = 'utf-8'
html = response.text

soup = BeautifulSoup(html, 'html.parser')

oneStep = soup.select('.main')[2]
twoStep = oneStep.select('tbody > tr')[1:]

날짜 = []
종가 = []
전일비 = []
거래량 = []

for i in twoStep:
    날짜.append(i.select('td')[0].text)
    종가.append(int(i.select('td')[1].text.replace(',', '')))
    전일비.append(int(i.select('td')[2].text.replace(',', '')))
    거래량.append(int(i.select('td')[6].text.replace(',', '')))

l = []

for i in range(len(날짜)):
    l.append({
        '날짜':날짜[i],
        '종가':종가[i],
        '전일비':전일비[i],
        '거래량':거래량[i],
        })

# json 쓰기
with open(os.path.join(os.getcwd(), 'data/stock.json'), "w", encoding="UTF-8-sig") as f_write:
    json.dump(l, f_write, ensure_ascii=False, indent=4)