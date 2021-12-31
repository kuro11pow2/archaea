
(window.onload = function () {

    function getRand(start, size) {
        return Math.floor(Math.random() * size) + start;
    }

    function getDefaultDataset(bot, top, size) {
        dataset = {
            label: 'asdf',
            borderColor: 'rgb(' + [getRand(50, 200), getRand(50, 200), getRand(50, 200)].join(',') + ')',
            fill: false,
            data: []
        }

        for (let i = 0; i < size; i++)
            dataset.data.push(getRand(bot, top));

        return dataset;
    }

    function addDataset(data, dataset) {
        data.datasets.push(dataset);
    }

    let data = {
        labels: [1, 2, 3, 4, 5],
        datasets: []
    };

    addDataset(data, getDefaultDataset(0, 100, data.labels.length));
    addDataset(data, getDefaultDataset(0, 100, data.labels.length));

    const options = {
        maintainAspectRatio: false,
        scales: {
            y: {
                stacked: true,
                grid: {
                    display: true,
                    color: "rgba(255,99,132,0.2)"
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },

    };

    const plugin = {
        id: 'custom_canvas_background_color',
        beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            ctx.save();
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = 'ghostwhite';
            ctx.fillRect(0, 0, chart.width, chart.height);
            ctx.restore();
        }
    };

    new Chart('chart', {
        type: 'line',
        data: data,
        options: options,
        plugins: [plugin]
    });

    if ('file:' == window.location.protocol) {
    }
    else {
        fetch(window.location.pathname.split('/').slice(0, -1).join('/') + '/data/youtube.json')
            .then(response => {
                return response.json();
            })
            .then(jsondata => console.log(jsondata));
    }
})();