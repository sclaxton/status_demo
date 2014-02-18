function PieCharts(){

    var drawArc = function (radius){
        var ret = d3.svg.arc()
            .startAngle(function(d){ return d.startAngle; })
            .endAngle(function(d){ return d.endAngle; })
            .innerRadius(0)
            .outerRadius(radius);
        return ret;
    };

    // interpolate the arcs in data space.
    var pieTween = function (d, i) {
        var self = this;
        var s0;
        var e0;
        var oldPieData = self.oldPieData;
        if(oldPieData[i]){
            s0 = oldPieData[i].startAngle;
            e0 = oldPieData[i].endAngle;
        } else if (!(oldPieData[i]) && oldPieData[i-1]) {
            s0 = oldPieData[i-1].endAngle;
            e0 = oldPieData[i-1].endAngle;
        } else if(!(oldPieData[i-1]) && oldPieData.length > 0){
            s0 = oldPieData[oldPieData.length-1].endAngle;
            e0 = oldPieData[oldPieData.length-1].endAngle;
        } else {
            s0 = 0;
            e0 = 0;
        }
        i = d3.interpolate({startAngle: s0, endAngle: e0}, {startAngle: d.startAngle, endAngle: d.endAngle});
        return function(t) {
            var b = i(t);
            return self.drawArc(b);
        };
    };

    var removePieTween = function (d, i) {
        s0 = 2 * Math.PI;
        e0 = 2 * Math.PI;
        i = d3.interpolate({startAngle: d.startAngle, endAngle: d.endAngle}, {startAngle: s0, endAngle: e0});
        return function(t) {
            var b = i(t);
            return this.drawArc(b);
        };
    };

    var textTween = function (d, i) {
        var r = this.radius;
        var textOffset = this.textOffset;
        var a;
        var oldPieData = this.oldPieData;
        if(oldPieData[i]){
            a = (oldPieData[i].startAngle + oldPieData[i].endAngle -
                 Math.PI)/2;
        } else if (!(oldPieData[i]) && oldPieData[i-1]) {
            a = (oldPieData[i-1].startAngle + oldPieData[i-1].endAngle -
                 Math.PI)/2;
        } else if(!(oldPieData[i-1]) && oldPieData.length > 0) {
            a = (oldPieData[oldPieData.length-1].startAngle +
                 oldPieData[oldPieData.length-1].endAngle - Math.PI)/2;
        } else {
            a = 0;
        }
        var b = (d.startAngle + d.endAngle - Math.PI)/2;

        var fn = d3.interpolateNumber(a, b);
        return function(t) {
            var val = fn(t);
            return "translate(" + Math.cos(val) * (r+textOffset) + "," +
                Math.sin(val) * (r+textOffset) + ")";
        };
    };

    // shuffles array at random using fisher-yates
    var shuffle_array = function  (array) {
        var currentIndex = array.length;
        var temp, randomIndex;
        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            // And swap it with the current element.
            temp = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temp;
        }
        return array;
    };


    var drawPaths = function (pieData) {
        var tweenDuration = this.tweenDuration;
        var pieTween = this.pieTween.bind(this);
        var removePieTween = this.removePieTween.bind(this);
        paths = this.arc.selectAll("path").data(pieData);
        paths.enter().append("svg:path")
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("class", function(d, i) {  return d.startAngle ? "empty" : "non-empty"; })
            .transition()
            .duration(tweenDuration)
            .attrTween("d", pieTween);
        paths.data(pieData)
            .attr("class", function(d, i) {  return d.startAngle ? "empty" : "non-empty"; })
            .transition()
            .duration(tweenDuration)
            .attrTween("d", pieTween);
        paths.exit()
            .transition()
            .duration(tweenDuration)
            .attrTween("d", removePieTween)
            .remove();
    };

    var drawLabels = function (labelData, total) {
        var textOffset = this.textOffset;
        var r = this.radius;
        var textTween = this.textTween.bind(this);
        var tweenDuration = this.tweenDuration;
        var valueLabels = this.labelGroup.selectAll("text.value").data(labelData)
            .attr("dy", function(d){
                if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
                    return 5;
                } else {
                    return -7;
                }
            })
            .attr("text-anchor", function(d){
                if ( (d.startAngle+d.endAngle)/2 < Math.PI ){
                    return "beginning";
                } else {
                    return "end";
                }
            }).text(function(d){
                var percentage = (d.value / total) * 100;
                return percentage.toFixed(1) + "%";
            });
        valueLabels.enter().append("svg:text")
            .attr("class", "value")
            .attr("transform", function(d) {
                return "translate(" + Math.cos(((d.startAngle+d.endAngle - Math.PI)/2)) * (r+textOffset) + "," + Math.sin((d.startAngle+d.endAngle - Math.PI)/2) * (r+textOffset) + ")";
            })
            .attr("dy", function(d){
                if ((d.startAngle+d.endAngle)/2 > Math.PI/2 && (d.startAngle+d.endAngle)/2 < Math.PI*1.5 ) {
                    return 5;
                } else {
                    return -7;
                }
            })
            .attr("text-anchor", function(d){
                if ( (d.startAngle+d.endAngle)/2 < Math.PI ){
                    return "beginning";
                } else {
                    return "end";
                }
            }).text(function(d){
                var percentage = (d.value / total) * 100;
                return percentage.toFixed(1) + "%";
            });
        // attach "capacity" label
        var text = valueLabels;
        var textBbox = text.node().getBBox();
        var textHeight = textBbox.height;
        var textWidth = textBbox.width;
        text.selectAll("tspan").data(["Capacity"])
            .enter().append("tspan")
            .attr("dy", textHeight)
            .attr("dx", 0 - textWidth)
            .text(String);
        valueLabels.transition().duration(tweenDuration).attrTween("transform", textTween);
        valueLabels.exit().remove();
    };

    // handler for metric menu
    var update = function (chartData) {
        var value = chartData.value;
        var max_val = chartData.max_val;
        var empty_slice = Number(max_val) - Number(value);
        var values = [ Number(value), empty_slice ];
        var pie_func = d3.layout.pie().sort(null);
        this.oldPieData = this.pieData;
        var pieData = shuffle_array(pie_func(values));
        this.pieData = pieData;
        var totalOctets = Number(max_val);
        if ( pieData.length > 0 ) {
            this.arc.selectAll("circle").remove();
            this.drawPaths(pieData);
            var label_data = pieData.filter( function(el, i) { return el.value != empty_slice; });
            this.drawLabels(label_data, totalOctets);
        }
    };

    function Chart(width, height, radius){
        var container = document.createElement("div");
        this.container = container;
        viz = d3.select(container).append("svg")
            .attr("class", "vis")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", "0 " + 0 + " " + width + " " + 5 * (height / 4) );
        this.arc = viz.append("g")
            .attr("class", "arc")
            .attr("transform", "translate(" + (width/2 - 40) + "," + 4 * (height / 8) + ")");
        this.arc.append("circle")
            .attr("fill", "#000")
            .attr("r", radius);
        this.labelGroup = viz.append("g")
            .attr("class", "label_group")
            .attr("transform", "translate(" + (width/2 - 40) + "," + 4 * (height / 8) + ")");

        this.drawArc = drawArc(radius);
        this.textOffset = 18;
        this.tweenDuration = 250;
        this.radius = radius;
        this.pieData = [];
        this.oldPieData = [];
    }

    function newChart(width, height, radius){
        return new Chart(width, height, radius);
    }

    Chart.prototype.update = update;
    Chart.prototype.removePieTween = removePieTween;
    Chart.prototype.pieTween = pieTween;
    Chart.prototype.textTween = textTween;
    Chart.prototype.drawPaths = drawPaths;
    Chart.prototype.drawLabels = drawLabels;

    // exports
    return {
        makeNewInstance: newChart,
    };
}

function initCloud(data){

    var cloudName, statsData;
    cloudName = data.name;
    statsData = data.stats;

    var cloudRootNode = this;

    var titleNode = document.createElement("button");
    titleNode.className = "title";
    titleNode.innerHTML = cloudName;
    titleNode.classList.add("open");
    cloudRootNode.appendChild(titleNode);

    var timeNode = document.createElement("span");
    cloudRootNode.appendChild(timeNode);
    timeNode.className = "time";
    timeNode.innerHTML = data.time;

    var contentNode = document.createElement("div");
    contentNode.className = "content";
    contentNode.classList.add("hide");
    contentNode.classList.add("small");
    cloudRootNode.appendChild(contentNode);

    d3.select(titleNode).on("click", function () {
        contentNode.classList.toggle("hide");
        contentNode.classList.toggle("show");
        titleNode.classList.toggle("open");
        titleNode.classList.toggle("closed");
    });

    var cloudMenuNode = document.createElement("div");
    cloudMenuNode.className = "cloud_menu";
    var statsNode = document.createElement("div");
    statsNode.className = "stats";

    var chartWidth = 300;
    var chartHeight = 300;
    var radius = chartWidth / 2 - 40;
    var pieCharts = PieCharts();
    var chart = pieCharts.makeNewInstance(chartWidth, chartHeight, radius);
    var chartNode = chart.container;
    chartNode.className = "chart";

    contentNode.appendChild(cloudMenuNode);
    contentNode.appendChild(statsNode);
    contentNode.appendChild(chart.container);

    var listNode = document.createElement("ul");
    cloudMenuNode.appendChild(listNode);
    for (var key in statsData){
        d3.select(listNode).append("li")
            .attr("class", "stat")
            .datum(statsData[key])
            .text(key);
    }

    var statsTable = document.createElement("table");
    statsNode.appendChild(statsTable);
    var inUseRow = document.createElement("tr");
    statsTable.appendChild(inUseRow);
    var inUseValueCell = document.createElement("td");
    inUseRow.appendChild(inUseValueCell);
    inUseValueCell.className = "stats_value";
    var totalRow = inUseRow.cloneNode(false);
    statsTable.appendChild(totalRow);
    var totalValueCell = inUseValueCell.cloneNode(false);
    totalRow.appendChild(totalValueCell);
    totalValueCell.className = "stats_total";

    var formatStat = function (str) {
       return (/[.]/).test(str) ? Number(str).toFixed(1) : str;
    };

    if(listNode.childNodes.length){
        var menuItems = d3.selectAll(listNode.childNodes);
        menuItems.on("click", function (datum, i){
            menuItems.each(function (d, i){
                this.classList.remove("stats_clicked");
            });
            this.classList.add("stats_clicked");
            chart.update(datum);
            var max = datum.max_val;
            var val = datum.value;
            var max_unit = "";
            var val_unit = "";
            if (datum.value_type == "storage"){
                var tmp;
                if ((tmp = Number(datum.max_val) / 1012) > 1){
                    max = tmp;
                    max_unit = "TB";
                }
                else {
                    max_unit = "GB";
                }

                if ((tmp = Number(datum.value) / 1012) > 1){
                    val = tmp;
                    val_unit = "TB";
                }
                else {
                    val_unit = "GB";
                }
            }
            totalValueCell.innerHTML = formatStat(max) + " " +  max_unit;
            inUseValueCell.innerHTML = formatStat(val) + " " + val_unit;
        });
    }
}

document.addEventListener('DOMContentLoaded', function(){
    console.log( "document loaded" );
    var data;
    request = new XMLHttpRequest();
    request.open('GET', 'json.txt', false);

    request.onload = function() {
        if (request.status >= 200 && request.status < 400){
        // Success!
            data = JSON.parse(request.responseText);
        } else {
           // We reached our target server, but it returned an error
        }
    };
    request.send();

    console.log(data);
    var dataArray = [];
    for (var key in data){
        var newObj = data[key];
        newObj.name = key;
        dataArray.push(newObj);
    }

    d3.select("#cloud_list").selectAll("li")
        .data(dataArray)
        .enter().append("li")
        .attr("class", "cloud")
        .each(initCloud);

});
