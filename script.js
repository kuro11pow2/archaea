(function () {
  const view_count_path = "/data/youtube_view_count.json";
  const channel_info_path = "/data/channel_info.json";
  const period = 30;

  function getRand(start, end) {
    if (start >= end) throw Error("start < end");
    return Math.floor(Math.random() * (end - start)) + start;
  }

  function getDataset(name, dataArr) {
    dataset = {
      label: name,
      borderColor:
        "rgb(" +
        [getRand(0, 200), getRand(0, 200), getRand(0, 200)].join(",") +
        ")",
      fill: false,
      data: dataArr,
    };
    return dataset;
  }

  class YoutubeChannel {
    constructor(id, name, categories, viewCountsObj = null) {
      this.id = id;
      this.name = name;
      this.categories = categories;
      this.viewCounts = viewCountsObj
        ? new Map(Object.entries(viewCountsObj))
        : new Map();
    }
  }

  function getYoutubeChannels(ViewJson, InfoJson) {
    let youtubeChannels = new Array();

    for (const id in ViewJson) {
      let channelAboutJson = ViewJson[id];
      let name = channelAboutJson["name"];
      let categories = new Set(InfoJson[id]["categories"]);
      let viewCountsObj = channelAboutJson["viewCounts"];
      youtubeChannels.push(
        new YoutubeChannel(id, name, categories, viewCountsObj)
      );
    }

    return youtubeChannels;
  }

  function getDates(youtubeChannels) {
    let dates = new Set();

    for (let channelAbout of youtubeChannels) {
      let rawDates = Array.from(channelAbout.viewCounts.keys());
      rawDates.forEach((date) => dates.add(date));
    }

    // 날짜를 연속적으로 만들기
    let sortedDates = Array.from(dates).sort();
    let fullDates = [];

    let startDate = new Date(sortedDates[0]);
    let endDate = new Date(sortedDates[sortedDates.length - 1]);

    // 시작 날짜부터 끝 날짜까지 모든 날짜를 추가
    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      fullDates.push(new Date(d).toISOString().slice(0, 10)); // YYYY-MM-DD 형식으로 날짜 추가
    }

    return fullDates;
  }

  function getInterpolateViewCountByDate(youtubeChannel, dates) {
    let viewCountByDate = [];
    let lastValidValue = null; // 마지막 유효 값
    let nextValidValue = null;
    let missingCount = 0;

    for (let i = 0; i < dates.length; i++) {
      let date = dates[i];

      // 현재 날짜에 데이터가 있는 경우
      if (youtubeChannel.viewCounts.has(date)) {
        let currentValue = youtubeChannel.viewCounts.get(date);

        if (lastValidValue !== null && missingCount > 0) {
          // 누락된 날짜 수만큼 균등 보간
          let increment = (currentValue - lastValidValue) / (missingCount + 1); // 매일 증가하는 값 계산
          for (let j = 1; j <= missingCount; j++) {
            viewCountByDate.push(lastValidValue + increment * j); // 균등 증가 보간
          }
        }

        viewCountByDate.push(currentValue);
        lastValidValue = currentValue; // 마지막 유효 값을 업데이트
        missingCount = 0; // 누락된 날짜 수 초기화
      } else {
        // 데이터가 없는 경우 누락된 날짜 수 증가
        missingCount++;
      }
    }

    // 마지막 누락된 날짜 처리 (다음 유효값이 없는 경우)
    if (missingCount > 0 && lastValidValue !== null) {
      for (let j = 1; j <= missingCount; j++) {
        viewCountByDate.push(lastValidValue); // 마지막 값으로 누락된 날짜 채움
      }
    }

    return viewCountByDate;
  }

  function getDiscreteDerivatives(arr) {
    let ret = new Array();
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] === 0) {
        ret.push(0);
      } else if (arr[i - 1] === 0) {
        ret.push(0);
      } else {
        let diff = arr[i] - arr[i - 1];
        ret.push(Math.max(0, diff));
      }
    }
    return ret;
  }

  function getSimpleMovingAverage(arr, period = 1) {
    let movingAvg = [];

    // 각 위치에서 단순 이동 평균을 계산
    for (let i = 0; i < arr.length; i++) {
      if (i < period - 1) {
        // 첫 period 미만의 값들에 대해 평균을 구할 수 없으므로 그대로 null 또는 0 처리
        movingAvg.push(null); // 또는 0으로 처리하고 싶으면 movingAvg.push(0);
      } else {
        // period 기간 동안의 값들의 평균을 계산
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += arr[i - j];
        }
        movingAvg.push(sum / period); // period 내 값들의 평균을 구함
      }
    }

    return movingAvg;
  }

  function getMovingAverage(arr, period = 1) {
    let movingAvg = [];
    let smoothingFactor = 2 / (period + 1); // EMA의 가중치 (smoothing factor)

    // 첫 번째 EMA는 SMA(단순 이동 평균)으로 초기화
    let sum = 0;
    for (let i = 0; i < period && i < arr.length; i++) {
      sum += arr[i];
    }

    // 초기값 처리: period보다 짧으면 그 구간의 평균으로 첫 번째 EMA를 설정
    let initialSMA = sum / Math.min(period, arr.length);
    movingAvg.push(initialSMA);

    // 나머지 EMA 계산
    for (let i = 1; i < arr.length; i++) {
      let prevEMA = movingAvg[i - 1]; // 이전 EMA 값
      let currentEMA = (arr[i] - prevEMA) * smoothingFactor + prevEMA;
      movingAvg.push(currentEMA);
    }

    return movingAvg;
  }

  function getDataByDate(youtubeChannel, dates) {
    let viewCountByDate = getInterpolateViewCountByDate(youtubeChannel, dates);

    // 조회수가 전날보다 적으면 전날과 다음날의 평균 사용
    for (let i = 1; i < viewCountByDate.length; i++) {
      if (viewCountByDate[i] < viewCountByDate[i - 1]) {
        let nextValidIdx = i + 1;

        // 다음날이 있는지 확인 (다음날이 없거나 데이터가 없는 경우를 처리)
        while (
          nextValidIdx < viewCountByDate.length &&
          viewCountByDate[nextValidIdx] === null
        ) {
          nextValidIdx++;
        }

        if (nextValidIdx < viewCountByDate.length) {
          // 다음날이 있을 때, 전날과 다음날의 평균을 사용
          let average =
            (viewCountByDate[i - 1] + viewCountByDate[nextValidIdx]) / 2;
          console.warn(
            `조회수 버그 발생: ${dates[i]}의 조회수 (${
              viewCountByDate[i]
            })가 전날(${
              dates[i - 1]
            })보다 작습니다. 전날과 다음날의 평균 (${average})을 사용합니다.`
          );
          viewCountByDate[i] = average;
        } else {
          // 다음날이 없을 때 (마지막 날) 전날의 데이터를 사용
          console.warn(
            `조회수 버그 발생: ${dates[i]}의 조회수 (${
              viewCountByDate[i]
            })가 전날(${
              dates[i - 1]
            })보다 작습니다. 다음날 데이터가 없으므로 전날 데이터를 사용합니다.`
          );
          viewCountByDate[i] = viewCountByDate[i - 1];
        }
      }
    }

    // 날짜 간 조회수 차이 계산
    let viewCountDiffArr = getDiscreteDerivatives(viewCountByDate);

    // 이동 평균 계산
    let viewCountDiffMovingAvg = getMovingAverage(viewCountDiffArr, period);

    for (let i = 0; i < viewCountDiffMovingAvg.length; i++) {
      if (viewCountDiffMovingAvg[i] >= 1) {
        viewCountDiffMovingAvg[i] = Math.log10(viewCountDiffMovingAvg[i]);
      } else {
        viewCountDiffMovingAvg[i] = 0;
      }
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
      labels: dates.slice(period + 1), // viewDeltasByDate의 개수가 1개 적다.
      datasets: new Array(),
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
          },
        },
      },
    };

    const config = {
      type: "line",
      data: chartData,
      options: options,
    };

    let chart = new Chart("chart", config);
    chart.data.datasets.forEach(function (ds) {
      function findYoutubeChannel(name) {
        return youtubeChannels.filter((ch) => ch.name === name)[0];
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
    let youtubeChannels = getYoutubeChannels(
      youtubeChannelViewJson,
      youtubeChannelInfoJson
    );
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
    if ("file:" == window.location.protocol) {
    } else {
      async function fetchYoutubeData() {
        let viewProm = fetch(
          window.location.pathname.split("/").slice(0, -1).join("/") +
            view_count_path
        );
        let infoProm = fetch(
          window.location.pathname.split("/").slice(0, -1).join("/") +
            channel_info_path
        );
        let viewRes = await viewProm;
        let infoRes = await infoProm;
        if (viewRes.ok && infoRes.ok) {
          let viewData = await viewRes.json();
          let infoData = await infoRes.json();
          return [viewData, infoData];
        } else console.log("채널 데이터 파일 읽어오기 실패");
      }

      fetchYoutubeData().then((response) => {
        run(...response);
      });
    }
  };
})();
