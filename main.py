from src.youtube import YoutubeChannel
from typing import List

import time
import asyncio
import os
import json
from datetime import datetime, timezone, timedelta


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


def save_json_data(absolute_path, data):
    dirname = os.path.dirname(absolute_path)

    if not os.path.exists(dirname):
        print('디렉터리가 존재하지 않음.')
        os.makedirs(dirname)

    with open(absolute_path, "w", encoding="UTF-8-sig") as f_write:
        json.dump(data, f_write, ensure_ascii=False, indent=4)


async def get_view_count_async(channel: YoutubeChannel):
    s = time.time()
    print(f'{channel.name} 요청, {s:0.4f}초')
    # if (name == "고세구 GOSEGU"):
    #     await asyncio.sleep(1)
    cnt = await channel.get_view_count_async()
    e = time.time()
    print(f'{channel.name} 응답, {e:0.4f}초, {e-s:0.4f}초 소요')
    return (channel, cnt)


async def update_view_count_async(channels: List[YoutubeChannel], view_counts):
    today = str(datetime.now(timezone(timedelta(hours=0))).date())

    s = time.time()
    futures = {get_view_count_async(channel) for channel in channels}

    # res = await asyncio.gather(*futures)

    res = []
    for future in asyncio.as_completed(futures):
        channel, cnt = await future
        id = channel.id
        name = channel.name

        if id not in view_counts.keys():
            view_counts[id] = {'name': name, 'viewCounts': dict()}

        if today not in view_counts[id]['viewCounts'].keys():
            view_counts[id]['viewCounts'][today] = cnt
        else:
            print(f'{today} 데이터 존재함: {name}, {cnt}')

    print(f'전체 조회 {time.time() - s:0.4f}초 소요')
    return res


def update_view_count_data(channels: List[YoutubeChannel], view_counts):
    loop = asyncio.get_event_loop()
    loop.run_until_complete(update_view_count_async(channels, view_counts))


def load_youtube_channel(relative_path: str) -> List[YoutubeChannel]:
    channel_info_path = relative_to_abs_path(relative_path)
    channel_data = load_json_data(channel_info_path)

    channels = [YoutubeChannel(id, prop['name'], prop['category'])
                for id, prop in channel_data.items()]
    return channels


def run():
    channels = load_youtube_channel("data/channel_info.json")

    youtube_view_count_path = relative_to_abs_path(
        "data/youtube_view_count.json")
    youtube_view_count = load_json_data(youtube_view_count_path)

    update_view_count_data(channels, youtube_view_count)
    save_json_data(youtube_view_count_path, youtube_view_count)


run()
