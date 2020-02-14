let createBarChart = function(file){

	let parseDate = d3.timeParse("%Y%m");

	// get the data to visualize
	d3.csv(file, function(d) {
		var tmp = {}
		var region = d["GEO Summary"].toLowerCase()

		tmp["period"] = d["Activity Period"],
		tmp["geo_summary"] = d["GEO Summary"],
		tmp["count"] = 	+d["Passenger Count"],
		tmp[region] = +d["Passenger Count"]

		return tmp
	}).then(function(rawData) {

		// Convert the data to a more manageable format
		let data = cleanData(rawData);

		console.log(data);
		drawEntireChart(data);
	});
}

let cleanData = function(rawData) {
	let data = d3.nest().key(tmp => tmp.period ).entries(rawData);
	return data
}

/*
 * our massive function to draw a bar chart. note some stuff in here
 * is bonus material (for transitions and updating the text)
 */
let drawEntireChart = function(data) {

	const margin = {
		top:	15,
		right:	35, // leave space for y-axis
		bottom: 60, // leave space for x-axis
		left:	75
	};

	// Draw legend
	
	// get the svg to draw on
	let svg = d3.select("body").select("svg#viz");
	console.assert(svg.size() == 1);

	// Draw axes
	//calculate the min and max of our data
	let countMin = 0;
	let countMax = d3.max(data, function(d) { return d.values[0].count +  d.values[1].count});

	let periodMin = d3.min(data, function(d) { return d.key;})
	let periodMax = d3.max(data, function(d) { return d.key;})

	// Should never hit this
	if (isNaN(countMax)) {
		countMax = 0;
	}

	// now we can calculate how much space we have to plot
	let bounds = svg.node().getBoundingClientRect();
	let plotWidth = bounds.width - margin.right - margin.left;
	let plotHeight = bounds.height - margin.top - margin.bottom;


	//y Scale
	let countScale = d3.scaleLinear()
		.domain([countMin, countMax])
		.range([plotHeight, 0])
		.nice();

	// x scale
	let getMonths = function(d){
	 	var val = [];

	 	for (item of d){
	 		val.push(item.key);
	 	}

	 	return val;}
	let months = getMonths(data).sort()

	let periodScale = d3.scaleBand()
		.domain(months) // all letters (not using the count here)
		.rangeRound([0, plotWidth])
		.paddingInner(0.01); // space between bars

	// z scale
	let passengerScale = d3.scaleOrdinal()
		.range(["blue", "teal"])
		.domain(["Domestic", "International"]);

	// we are actually going to draw on the "plot area"
	let plot = svg.append("g").attr("id", "plot");
	plot.attr("transform", `translate(${margin.left}, ${margin.top})`);

	console.assert(plot.size() == 1);

	// now lets draw our x- and y-axis
	let xAxis = d3.axisBottom(periodScale);

	let month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September"]
	xAxis.tickFormat(function(d, i){
		return month_names[i]
	})

	let yAxis = d3.axisLeft(countScale);

	yAxis.ticks(7);
	yAxis.tickFormat(d3.formatPrefix(".0", 1e6));
	

	let xGroup = plot.append("g").attr("id", "x-axis");
	xGroup.call(xAxis);
	xGroup.attr("transform", "translate(0," + plotHeight + ")");

	// do the same for our y axix
	let yGroup = plot.append("g").attr("id", "y-axis");
	yGroup.call(yAxis);
	// yGroup.attr("transform", `translate(${margin.left}, 0)`);

	//Draw titles
	let midpoint = function(range) {
		return range[0] + (range[1] - range[0]) / 2.0;
	}

	const xMiddle = margin.left + midpoint(countScale.range());
	const yMiddle = margin.top + midpoint(periodScale.range());

	const xTitle = xGroup.append('text')
    	.attr('class', 'axis-title')
    	.text('Activity Period for [2019]');

	xTitle.attr('x', 0);
	xTitle.attr('y', 0);
	xTitle.attr('dy', 45);
	xTitle.attr('dx', xMiddle + 150);
	xTitle.attr('text-anchor', 'middle');


	const yTitle = yGroup.append('text')
		.attr('class', 'axis-title')
		.text('Passenger Count');

	// keep x, y at 0, 0 for rotation around the origin
	yTitle.attr('x', 0);
	yTitle.attr('y', 0);
	yTitle.attr('dy', -50);
	yTitle.attr('dx', -200);
	yTitle.attr('text-anchor', 'middle');
	yTitle.attr('transform', 'rotate(-90)');
	
	// Draw Bars
	let getPairs = function(d) {
		let ret = [];

		for (var tmp of d) {
			ret.push([tmp.key, tmp.values[0].count+tmp.values[1].count]);
		}

		return ret;
	}

	let pairs = getPairs(data);
	let bars = plot.selectAll("rect")
		.data(data);

	// we use the enter() selection to add new bars for new data
	bars.enter().append("rect")
		.attr("class", "bar")
		.attr("width", periodScale.bandwidth())
		.attr("x", d => periodScale(d[0]))
		.attr("y", d => countScale(d[1]))
		.attr("height", d => plotHeight - countScale(d[1]))
		.attr("fill", function(d, i) {
			debugger;
			passengerScale(d.values[i].geo_summary)
		})
		.each(function(d, i, nodes) {
			console.log("Added bar for:", d[0]);
		});

	/*
	 * we need our data as an array of key, value pairs before binding
	 */

	// so we can access some of these elements later...
	// add them to our chart global
	chart.plotWidth = plotWidth;
	chart.plotHeight = plotHeight;

	chart.xAxis = xAxis;
	chart.yAxis = yAxis;

	chart.countScale = countScale;
	chart.periodScale = periodScale;

};





