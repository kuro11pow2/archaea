
(function () {

    window.onload = function () {

        function getRandClosed(start, end) {
            return Math.floor(Math.random() * (end - start + 1)) + start;
        }

        function getDataset(name, dataArr) {
            dataset = {
                label: name,
                borderColor: 'rgb(' + [getRandClosed(0, 200), getRandClosed(0, 200), getRandClosed(0, 200)].join(',') + ')',
                fill: false,
                data: dataArr
            }
            return dataset
        }

        class ChannelAbout {
            constructor(id, name, viewCountsObj = null) {
                this.id = id;
                this.name = name;
                this.viewCounts = viewCountsObj ? new Map(Object.entries(viewCountsObj)) : new Map();
            }
        }


        if ('file:' == window.location.protocol) {
        }
        else {
            fetch(window.location.pathname.split('/').slice(0, -1).join('/') + '/data/youtube.json')
                .then(response => {
                    return response.json();
                })
                .then(channelAboutArrJson => {

                    let channelAboutArr = new Array();

                    for (const id in channelAboutArrJson) {
                        let channelAboutJson = channelAboutArrJson[id];
                        let name = channelAboutJson['name'];
                        let viewCountsObj = channelAboutJson['viewCounts'];
                        channelAboutArr.push(new ChannelAbout(id, name, viewCountsObj))
                    }
                    console.log(channelAboutArr);

                    // 출력할 모든 날짜 집합 구하기
                    let allDateSet = new Set();

                    for (let channelAbout of channelAboutArr) {
                        let dates = channelAbout.viewCounts.keys();

                        for (let date of dates) {
                            allDateSet.add(date);
                        }
                    }
                    console.log(allDateSet);

                    // 각 채널에 대하여 출력할 데이터를 계산
                    let viewCountsDiffArrMap = new Map();
                    for (let ch of channelAboutArr) {

                        // 출력해야 하는 날인데 데이터가 누락된 경우 전날의 데이터를 사용하도록 함
                        let viewCountArr = new Array();
                        allDateSet.forEach(date => {
                            if (ch.viewCounts.has(date)) {
                                viewCountArr.push(ch.viewCounts.get(date));
                            }
                            else if (viewCountArr.length > 0) {
                                viewCountArr.push(viewCountArr[viewCountArr.length - 1]);
                            }
                        })

                        // 날짜 간 조회수 차이에 상용 로그를 담은 배열을 생성 (크기가 -1 됨)
                        let viewCountDiffArr = new Array();
                        for (let i = 0; i < viewCountArr.length - 1; i++) {
                            viewCountDiffArr.push(Math.log10(viewCountArr[i + 1] - viewCountArr[i]));
                        }

                        viewCountsDiffArrMap.set(ch.id, viewCountDiffArr);
                    }
                    console.log(viewCountsDiffArrMap);

                    // 차트에 전달할 형태로 데이터 변환
                    let data = {
                        labels: Array.from(allDateSet).slice(1),
                        datasets: new Array()
                    };

                    for (let ch of channelAboutArr) {
                        let name = ch.name;
                        let dataArr = viewCountsDiffArrMap.get(ch.id);
                        let dataset = getDataset(name, dataArr);
                        data.datasets.push(dataset);
                    }

                    // 차트 생성
                    const options = {
                        maintainAspectRatio: false,
                    };

                    const config = {
                        type: 'line',
                        data: data,
                        options: options,
                    }

                    new Chart('chart', config);
                });
        }
    }
})();