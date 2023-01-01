from src.youtube_channel import YoutubeChannel

import os, json, time
from datetime import datetime, timezone, timedelta
import asyncio


def relative_to_abs_path(relative_path):
    return os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), relative_path))


def load_json_data(absolute_path):
    data = None
    dirname = os.path.dirname(absolute_path)

    if not os.path.exists(dirname):
        print('디렉터리가 존재하지 않음.')
        os.makedirs(dirname)

    try:
        with open(absolute_path, 'r', encoding="UTF-8-sig") as f:
            data = json.JSONDecoder().decode(f.read())
    except FileNotFoundError:
        print('파일이 존재하지 않음.')
        data = dict()

    return data


async def get_view_count_async(id, name):
    channel = YoutubeChannel(id, name)
    s = time.time()
    print(f'{name} 요청, {s:0.4f}초')
    # if (name == "고세구 GOSEGU"):
    #     await asyncio.sleep(1)
    cnt = await channel.get_view_count_async()
    e = time.time()
    print(f'{name} 응답, {e:0.4f}초, {e-s:0.4f}초 소요')
    return (channel, cnt)


async def update_view_count_async(channels, data):
    today = str(datetime.now(timezone(timedelta(hours=0))).date())

    s = time.time()
    futures = {get_view_count_async(id, name) for id, name in channels.items()}
    
    # res = await asyncio.gather(*futures)

    res = []
    for future in asyncio.as_completed(futures):
        channel, cnt = await future
        id = channel.id
        name = channel.name

        if id not in data.keys(): 
            data[id] = {'name':name, 'viewCounts':dict()}

        if today not in data[id]['viewCounts'].keys():
            data[id]['viewCounts'][today] = cnt
        else:
            print(f'{today} 데이터 존재함: {name}, {cnt}')


    print(f'전체 조회 {time.time() - s:0.4f}초 소요')
    return res


def update_view_count_data(channels, data):
    loop = asyncio.get_event_loop()
    loop.run_until_complete(update_view_count_async(channels, data))


def save_view_count_data(absolute_path, data):
    with open(absolute_path, "w", encoding="UTF-8-sig") as f_write:
        json.dump(data, f_write, ensure_ascii=False, indent=4)


def Run():
    channel_info_path = relative_to_abs_path("data/channel_info.json")
    youtube_view_count_path = relative_to_abs_path("data/youtube_view_count.json")

    channels = load_json_data(channel_info_path)
    youtube_view_count = load_json_data(youtube_view_count_path)

    update_view_count_data(channels, youtube_view_count)
    save_view_count_data(youtube_view_count_path, youtube_view_count)


Run()