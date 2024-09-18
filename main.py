from src.youtube import YoutubeChannel, YoutubeViewCount
from typing import List, Dict

import time
import asyncio
import os
import json
import random
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


async def update_view_count_async(channels: List[YoutubeChannel], view_counts: Dict[str, YoutubeViewCount]):
    today = str(datetime.now(timezone(timedelta(hours=0))).date())
    
    s = time.time()

    batch_size = 5
    random_min_sec = 3
    random_max_sec = 10

    for i in range(0, len(channels), batch_size):
        batch_channels = channels[i:i + batch_size]
        futures = [get_view_count_async(channel) for channel in batch_channels]

        for future in asyncio.as_completed(futures):
            channel, cnt = await future

            # cnt가 None인 경우 제외
            if cnt is None:
                print(f"{(channel.id, channel.name)}의 조회수 값이 None이므로 제외.")
                continue

            if channel.id not in view_counts.keys():
                view_counts[channel.id] = YoutubeViewCount(channel.id, channel.name)

            view_counts[channel.id].add(today, cnt)

        delay = random.uniform(random_min_sec, random_max_sec)
        print(f'{delay:.2f}초 딜레이 후 다음 배치 처리...')
        await asyncio.sleep(delay)

    print(f'전체 조회 {time.time() - s:0.4f}초 소요')


def update_view_count_data(channels: List[YoutubeChannel], view_counts: Dict[str, YoutubeViewCount]):
    loop = asyncio.get_event_loop()
    loop.run_until_complete(update_view_count_async(channels, view_counts))


def load_youtube_channel(relative_path: str) -> List[YoutubeChannel]:
    channel_info_path = relative_to_abs_path(relative_path)
    channel_data = load_json_data(channel_info_path)

    channels: List[YoutubeChannel] = []
    for item in channel_data.items():
        channels.append(YoutubeChannel())
        channels[-1].load_json(item)

    return channels


def load_youtube_view_counts(relative_path: str) -> Dict[str, YoutubeViewCount]:
    youtube_view_count_path = relative_to_abs_path(relative_path)
    youtube_view_count = load_json_data(youtube_view_count_path)

    view_counts: Dict[str, YoutubeViewCount] = dict()
    for item in youtube_view_count.items():
        view_counts[item[0]] = YoutubeViewCount()
        view_counts[item[0]].load_json(item)

    return view_counts


def save_youtube_view_counts(relative_path: str, view_counts: Dict[str, YoutubeViewCount]):
    json_dict = dict()
    for id, view_count in view_counts.items():
        json_dict.update(view_count.get_dict4json())
    save_json_data(relative_path, json_dict)


def run():
    channel_info_path = "data/channel_info.json"
    view_count_path = "data/youtube_view_count.json"

    channels = load_youtube_channel(channel_info_path)
    view_counts = load_youtube_view_counts(view_count_path)

    update_view_count_data(channels, view_counts)
    save_youtube_view_counts(view_count_path, view_counts)


run()
