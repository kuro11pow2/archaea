from src.youtube import ChannelAbout

import os, json
from datetime import datetime, timezone, timedelta

today = str(datetime.now(timezone(timedelta(hours=0))).date())
target_dir = os.path.join(os.getcwd(), 'data')
target_full = os.path.join(target_dir, 'youtube.json')
channels = {
    'c/5MinuteCraftsYouTube':'5-Minute Crafts',
    'channel/UCUj6rrhMTR9pipbAWBAMvUQ':'침착맨',
    'channel/UC3WZlO2Zl8NE1yIUgtwUtQw':'임영웅',
    'channel/UC3SyT4_WLHzN7JmHQwKQZww':'이지금 [IU Official]',
    'channel/UCOp66Vup07X0YziXaaxqs2A':'haha ha',
    'channel/UCzgNzUJkXaUbVgHyiycQ2Zw':'휘용 Hwiyong',
    'channel/UCLKuglhGlMmDteQKoniENIQ':'14F 일사에프',
    'c/BANGTANTV':'BANGTANTV',
    'c/JFlaMusic':'JFlaMusic',
    'user/woowakgood':'우왁굳의 게임방송',
    'channel/UCV9WL7sW6_KjanYkUUaIDfQ':'고세구 GOSEGU'
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

