(function () {
    const view_count_path = '/data/youtube_view_count.json';
    const channel_info_path = '/data/channel_info.json';
    const period = 20;

    function getRand(start, end) {
        if (start >= end)
            throw Error("start < end");
        return Math.floor(Math.random() * (end - start)) + start;
    }

    function getDataset(name, dataArr) {
        dataset = {
            label: name,
            borderColor: 'rgb(' + [getRand(0, 200), getRand(0, 200), getRand(0, 200)].join(',') + ')',
            fill: false,
            data: dataArr
        }
        return dataset
    }

    class YoutubeChannel {
        constructor(id, name, categories, viewCountsObj = null) {
            this.id = id;
            this.name = name;
            this.categories = categories;
            this.viewCounts = viewCountsObj ? new Map(Object.entries(viewCountsObj)) : new Map();
        }
    }

    function getYoutubeChannels(ViewJson, InfoJson) {
        let youtubeChannels = new Array();

        for (const id in ViewJson) {
            let channelAboutJson = ViewJson[id];
            let name = channelAboutJson['name'];
            let categories = new Set(InfoJson[id]['categories']);
            let viewCountsObj = channelAboutJson['viewCounts'];
            youtubeChannels.push(new YoutubeChannel(id, name, categories, viewCountsObj));
        }

        return youtubeChannels;
    }

    function getDates(youtubeChannels) {
        let dates = new Set();

        for (let channelAbout of youtubeChannels) {
            let rawDates = channelAbout.viewCounts.keys();

            for (let date of rawDates) {
                dates.add(date);
            }
        }

        return Array.from(dates).sort();
    }

    function getInterpolateViewCountByDate(youtubeChannel, dates) {
        let viewCountByDate = new Array();

        dates.forEach(date => {
            // 데이터가 누락된 경우 전날의 데이터를 사용하도록 함
            if (youtubeChannel.viewCounts.has(date)) {
                viewCountByDate.push(youtubeChannel.viewCounts.get(date));
            }
            else if (viewCountByDate.length > 0) {
                viewCountByDate.push(viewCountByDate[viewCountByDate.length - 1]);
            }
            else {
                viewCountByDate.push(0);
            }
        })
        return viewCountByDate;
    }

    function getDiscreteDerivatives(arr) {
        let ret = new Array();
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] === 0) {
                ret.push(0);
            }
            else if (arr[i - 1] === 0) {
                ret.push(0);
            }
            else {
                let diff = arr[i] - arr[i - 1];
                ret.push(Math.max(0, diff));
            }
        }
        return ret;
    }

    function getMovingAverage(arr, period = 1) {
        let movingAvg = new Array();

        let firstNonZeroIdx = undefined;
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
            if (firstNonZeroIdx === undefined) {
                if (arr[i] === 0) {
                    movingAvg.push(0);
                    continue;
                }
                else {
                    firstNonZeroIdx = i;
                }
            }

            sum += arr[i];

            if (i < period + firstNonZeroIdx) {
                movingAvg.push(0);
            }
            else {
                sum -= arr[i - period];
                movingAvg.push(sum / period);
            }
        }

        return movingAvg;
    }

    function getDataByDate(youtubeChannel, dates) {
        let viewCountByDate = getInterpolateViewCountByDate(youtubeChannel, dates);

        // 날짜 간 조회수 차이 계산
        // 길이가 -1 주의
        let viewCountDiffArr = getDiscreteDerivatives(viewCountByDate);

        // 이동 평균 계산
        let viewCountDiffMovingAvg = getMovingAverage(viewCountDiffArr, period);

        for (let i = 0; i < viewCountDiffMovingAvg.length; i++) {
            viewCountDiffMovingAvg[i] = Math.log10(viewCountDiffMovingAvg[i]);
        }

        return viewCountDiffMovingAvg;
    }

    function getDataByDateByChannel(youtubeChannels, dates) {
        let dataByDateByChannel = new Map();
        for (let youtubeChannel of youtubeChannels) {
            let dataByDate = getDataByDate(youtubeChannel, dates);
            dataByDateByChannel.set(youtubeChannel.id, dataByDate);
        }
        return dataByDateByChannel;
    }

    function getChartData(youtubeChannels, dates, viewDeltasByDate) {
        // 차트에 전달할 형태로 데이터 변환
        let chartData = {
            labels: dates.slice(period+1), // viewDeltasByDate의 개수가 1개 적다.
            datasets: new Array()
        };

        for (let ch of youtubeChannels) {
            let name = ch.name;
            let dataArr = viewDeltasByDate.get(ch.id).slice(period);
            let dataset = getDataset(name, dataArr);
            chartData.datasets.push(dataset);
        }
        return chartData;
    }

    function DrawChart(youtubeChannels, chartData) {
        // 차트 생성
        const options = {
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        autoSkip: true,
                    }
                }
            }
        };

        const config = {
            type: 'line',
            data: chartData,
            options: options,
        }

        let chart = new Chart('chart', config);
        chart.data.datasets.forEach(function (ds) {
            function findYoutubeChannel(name) {
                return youtubeChannels.filter(ch => ch.name === name)[0];
            }
            let name = ds.label;
            let ch = findYoutubeChannel(name);
            if (ch.categories.has("이세계 아이돌")) {
                return;
            }
            ds.hidden = !ds.hidden;
        });
        chart.update();
    }

    function run(youtubeChannelViewJson, youtubeChannelInfoJson) {
        // 유튜브 뷰 데이터 로딩
        let youtubeChannels = getYoutubeChannels(youtubeChannelViewJson, youtubeChannelInfoJson);
        console.log(youtubeChannels);

        // 기록된 모든 날짜 구하기
        let dates = getDates(youtubeChannels);
        console.log(dates);

        // 각 채널에 대하여 출력할 데이터를 계산 (배열 길이 1 감소됨)
        let viewDeltasByDate = getDataByDateByChannel(youtubeChannels, dates);
        console.log(viewDeltasByDate);

        // Chart 데이터 형식으로 가공
        let chartData = getChartData(youtubeChannels, dates, viewDeltasByDate);
        console.log(chartData);

        DrawChart(youtubeChannels, chartData);
    }

    window.onload = function () {

        if ('file:' == window.location.protocol) {
        }
        else {
            async function fetchYoutubeData() {
                let viewProm = fetch(window.location.pathname.split('/').slice(0, -1).join('/') + view_count_path);
                let infoProm = fetch(window.location.pathname.split('/').slice(0, -1).join('/') + channel_info_path);
                let viewRes = await viewProm;
                let infoRes = await infoProm;
                if (viewRes.ok && infoRes.ok) {
                    let viewData = await viewRes.json();
                    let infoData = await infoRes.json();
                    return [viewData, infoData];
                }
                else
                    console.log("채널 데이터 파일 읽어오기 실패");
            }

            fetchYoutubeData()
                .then(response => {
                    run(...response);
                });
        }
    }
})();