import requests
import json
from bs4 import BeautifulSoup
import asyncio

 
loop = asyncio.get_event_loop()

class YoutubeChannel:

    def __init__(self, id, name):
        self.id = id
        self.name = name
        self.url = 'https://www.youtube.com/' + id + '/about'
        self.__res = None
        self.__view_count = None

    async def get_view_count_async(self, refresh=False):
        if (self.__res is None or self.__view_count is None or refresh):
            await self.__request_async()
            self.__parse()
        return self.__view_count
    
    def get_view_count(self, refresh=False):
        if (self.__res is None or self.__view_count is None or refresh):
            # 아래처럼 호출해도 C#의 .Wait() 방식으로 쓰레드가 정지되지는 않는다.
            # result = loop.run_until_complete(self.get_view_count_async(refresh))
            self.__request()
            self.__parse()
        return self.__view_count

    def __request(self):
        self.__res = requests.request("GET", self.url)

        if self.__res.status_code != 200:
            raise Exception(f'요청 실패. 응답 코드 {self.__res.status_code}')

    async def __request_async(self):
        self.__res = await loop.run_in_executor(None, requests.request, "GET", self.url)

        if self.__res.status_code != 200:
            raise Exception(f'요청 실패. 응답 코드 {self.__res.status_code}')
    
    def __parse(self):
        if self.__res is None:
            raise Exception('request 먼저 수행')

        soup = BeautifulSoup(self.__res.text, "html.parser")
        body = soup.find_all("body")[0]
        scripts = body.find_all("script")

        scripts_str = '\n\n'.join(map(str, scripts))
        target_pos = scripts_str.find('viewCountText')
        scripts_str = scripts_str[target_pos:target_pos+100]

        target_left, target_right = scripts_str.find('{'), scripts_str.find('}')+1
        target_str = scripts_str[target_left:target_right]

        dic = json.loads(target_str)
        target = list(dic.values())[0]

        result = ''
        for i in target:
            try:
                int(i)
            except:
                pass
            else:
                result += i
            
        self.__view_count = int(result)