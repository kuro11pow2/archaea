
(function () {

    window.onload = function () {

        function getRand(start, size) {
            return Math.floor(Math.random() * size) + start;
        }

        function getRandomDataset(bot, top, size) {
            dataset = getDataset(test, []);

            for (let i = 0; i < size; i++)
                dataset.data.push(getRand(bot, top));

            return dataset;
        }

        function getDataset(name, dataArr) {
            dataset = {
                label: name,
                borderColor: 'rgb(' + [getRand(50, 200), getRand(50, 200), getRand(50, 200)].join(',') + ')',
                fill: false,
                data: dataArr
            }
            return dataset
        }

        function getData(jsondata) {

            let data = {
                labels: [],
                datasets: []
            };

            let allDates = new Set();

            for (const name in jsondata) {
                for (var date of Object.keys(jsondata[name])) {
                    allDates.add(date);
                }
            }

            data.labels = Array.from(allDates).slice(1);

            for (const name in jsondata) {

                let curDates = new Set(Object.keys(jsondata[name]));
                let dataArr = [];

                allDates.forEach(date => {

                    if (curDates.has(date)) {
                        dataArr.push(jsondata[name][date]);
                    }
                    else {
                        if (dataArr.length > 0) {
                            dataArr.push(dataArr[dataArr.length - 1])
                        }
                    }

                })

                for (let i = dataArr.length - 1; i > 0; i--) {
                    dataArr[i] = Math.log10(dataArr[i] - dataArr[i - 1]);
                }

                let dataset = getDataset(name, dataArr.slice(1));
                data.datasets.push(dataset);
            }

            return data;
        }


        if ('file:' == window.location.protocol) {
        }
        else {
            fetch(window.location.pathname.split('/').slice(0, -1).join('/') + '/data/youtube.json')
                .then(response => {
                    return response.json();
                })
                .then(jsondata => {
                    data = getData(jsondata);

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