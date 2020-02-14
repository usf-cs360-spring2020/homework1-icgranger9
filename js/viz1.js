let createBarChart = function(file){

	let parseDate = d3.timeParse("%Y%m");

	// get the data to visualize
	d3.csv(file, function(d) {
		var tmp = {}

		tmp["period"] = d["Activity Period"];
		tmp["geo_summary"] = d["GEO Summary"];
		tmp["count"] = 	+d["Passenger Count"];

		return tmp;

	}).then(function(rawData) {

		// Convert the data to a more manageable format
		let data = cleanData(rawData);

		console.log(data);
		drawEntireChart(data);
	});
}

let cleanData = function(rawData) {
	let tmp = {}

	// gets data into dict with key being the period, and the val being a dict of international and domestic count
	for (var d of rawData){
		if (d.period in tmp) {
			tmp[d.period][d.geo_summary.toLowerCase()] = d.count;
		}
		else {
			var dct = {}
			dct[d.geo_summary.toLowerCase()] = d.count
			tmp[d.period] = dct;
		}
 
	}

	//gets the data into a list of dicts
	let data = []
	for (key in tmp) {
		let val = tmp[key]
		val["period"] = key
		data.push(val)
	}

	return data
}

/*
 * our massive function to draw a bar chart. note some stuff in here
 * is bonus material (for transitions and updating the text)
 */
let drawEntireChart = function(data) {

	const margin = {
		top:	30,
		right:	35, 
		bottom: 60, // leave space for x-axis
		left:	75	// leave space for y-axis
	};

	// Draw legend
	
	// get the svg to draw on
	let svg = d3.select("body").select("svg#viz");
	console.assert(svg.size() == 1);

	// Draw axes
	//calculate the min and max of our data
	let countMin = 0;
	let countMax = d3.max(data, function(d) { return d.domestic +  d.international});

	let periodMin = d3.min(data, function(d) { return d.period;})
	let periodMax = d3.max(data, function(d) { return d.period;})

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
	let periodScale = d3.scaleBand()
		.domain(data.map(d => d.period)) // all letters (not using the count here)
		.rangeRound([0, plotWidth])
		.paddingInner(0.01); // space between bars

	// z scale
	let colorKey = ["domestic", "international"]
	let colorScale = d3.scaleOrdinal()
		.range(["#5779a3", "#85b5b3"])
		.domain(colorKey);

	// create the plot
	let plot = svg.append("g").attr("id", "plot");
	plot.attr("transform", `translate(${margin.left}, ${margin.top})`);

	console.assert(plot.size() == 1);

	// now lets draw our x-axis
	let xAxis = d3.axisBottom(periodScale);
	xAxis.tickFormat(function(d, i){
		return ["January", "February", "March", "April", "May", "June", "July", "August", "September"][i]
	})

	let xGroup = plot.append("g").attr("id", "x-axis");
	xGroup.call(xAxis);
	xGroup.attr("transform", "translate(0," + plotHeight + ")");

	// do the same for our y axis
	let yAxis = d3.axisLeft(countScale);
	yAxis.tickFormat(d3.formatPrefix(".0", 1e6));
	yAxis.ticks(7);
	let yGroup = plot.append("g").attr("id", "y-axis");
	yGroup.call(yAxis);


	//Draw titles
	const xTitle = xGroup.append('text')
    	.attr('class', 'axis-title')
    	.text('Activity Period for [2019]');

	xTitle.attr('x', 0);
	xTitle.attr('y', 0);
	xTitle.attr('dy', 45);
	xTitle.attr('dx', 400);
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

	var group = plot.selectAll("g.layer")
			.data(d3.stack().keys(colorKey)(data), function(d) {d.period});

      group.exit().remove()

      group.enter().append("g")
			.classed("layer", true)
			.attr("fill", d => colorScale(d.key));

	let bars = plot.selectAll("g.layer").selectAll("rect")
		.data(data);


	// we use the enter() selection to add new bars for new data
	bars.enter().append("rect")
		.attr("class", "bar")
		.merge(bars)
		.attr("width", periodScale.bandwidth())
		.attr("x", d => periodScale(d.period))
		.attr("y", d => countScale(d.domestic + d.international))
		.attr("height", d => plotHeight - countScale(d.domestic+ d.international))
		.attr("fill", function(d, i) {
			colorScale(d);});
		// })
		// .each(function(d, i, nodes) {
		// 	console.log("Added bar for:", d.period);
		// });

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





