from src.youtube import ChannelAbout

import os, json
from datetime import datetime, timezone, timedelta

today = str(datetime.now(timezone(timedelta(hours=0))).date())
target_dir = os.path.join(os.getcwd(), 'data')
target_full = os.path.join(target_dir, 'youtube.json')
channels = {
    '5-Minute Crafts':'5MinuteCraftsYouTube',
    '침착맨':'UCUj6rrhMTR9pipbAWBAMvUQ'
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

for name, id in channels.items():
    print(f'{name} 조회')
    cnt = ChannelAbout(id).request().parse_view()

    if name not in data.keys(): 
        data[name] = dict()
    if today not in data[name].keys():
        data[name] = {**data[name], **{today: cnt}}
        print(data)
    else:
        print(f'{today} 데이터 존재함: {name}, {cnt}')


with open(target_full, "w", encoding="UTF-8-sig") as f_write:
    json.dump(data, f_write, ensure_ascii=False, indent=4)

