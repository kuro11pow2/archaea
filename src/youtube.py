import requests
import json
from bs4 import BeautifulSoup


class ChannelAbout:

    def __init__(self, cid):
        self.url = 'https://www.youtube.com/channel/' + cid + '/about'
        self.res = None

    def request(self):
        self.res = requests.request("GET", self.url)
        self.encoding = 'utf-8'
        return self
    
    def parse_view(self):
        if self.res is None:
            raise Exception('request first')

        soup = BeautifulSoup(self.res.text, "html.parser")
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
            
        view = int(result)
        return view


if __name__ == '__main__':
    channels = map(ChannelAbout, ['UCV9WL7sW6_KjanYkUUaIDfQ', 'UCUj6rrhMTR9pipbAWBAMvUQ'])
    for ch in channels:
        print(ch.request().parse_view())
