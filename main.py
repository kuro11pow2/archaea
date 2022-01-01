from src.youtube import ChannelAbout

import os, json
from datetime import datetime, timezone, timedelta

today = str(datetime.now(timezone(timedelta(hours=0))).date())
target_dir = os.path.join(os.getcwd(), 'data')
target_full = os.path.join(target_dir, 'youtube.json')
channels = {
    'c/5MinuteCraftsYouTube':'5-Minute Crafts',
    'channel/UCUj6rrhMTR9pipbAWBAMvUQ':'침착맨'
    }
data = None

if not os.path.exists(target_dir):
    print('기존 디렉터리가 존재하지 않음.')
    os.makedirs(target_dir)

try:
    with open(target_full, 'r', encoding="UTF-8-sig") as f:
        data = json.JSONDecoder().decode(f.read())
except Exception as e:
    print('기존 파일이 존재하지 않음.')
    data = dict()

for id, name in channels.items():

    print(f'{name} 조회')
    cnt = ChannelAbout(id).request().parse_view()

    if id not in data.keys(): 
        data[id] = {'name':name, 'viewCounts':dict()}

    if today not in data[id]['viewCounts'].keys():
        data[id]['viewCounts'] = {**data[id]['viewCounts'], **{today: cnt}}
        print(data)
    else:
        print(f'{today} 데이터 존재함: {name}, {cnt}')


with open(target_full, "w", encoding="UTF-8-sig") as f_write:
    json.dump(data, f_write, ensure_ascii=False, indent=4)

