let createBarChart = function(file){

	let parseDate = d3.timeParse("%Y%m");

	// get the data to visualize
	d3.csv(file, function(d) {
		return {
			period : d["Activity Period"],
			month : parseDate(d["Activity Period"]),
			geo_summary : d["GEO Summary"],
			count : +d["Passenger Count"]
		};
	}).then(function(d) {

		// Convert the data to a more manageable format
		let data = d3.nest().key(tmp => tmp.period ).entries(d);

		console.log(data);
		drawChart(data);
	});
}

/*
 * our massive function to draw a bar chart. note some stuff in here
 * is bonus material (for transitions and updating the text)
 */
let drawChart = function(data) {
	// get the svg to draw on
	let svg = d3.select("body").select("svg#viz");
	console.log(svg)

	// make sure we selected exactly 1 element
	console.assert(svg.size() == 1);

	//calculate the min and max of our data
	let countMin = 0;
	let countMax = d3.max(data, function(d) { return d.values[0].count +  d.values[1].count});

	let periodMin = d3.min(data, function(d) { return d.key;})
	let periodMax = d3.max(data, function(d) { return d.key;})

	// Should never hit this
	if (isNaN(countMax)) {
		countMax = 0;
	}

	console.log("count bounds:", [countMin, countMax]);
	console.log("period bounds:", [periodMin, periodMax]);

	/*
	 * before we draw, we should decide what kind of margins we
	 * want. this will be the space around the core plot area,
	 * where the tick marks and axis labels will be placed
	 * https://bl.ocks.org/mbostock/3019563
	 */
	let margin = {
		top:	15,
		right:	35, // leave space for y-axis
		bottom: 30, // leave space for x-axis
		left:	125
	};

	// now we can calculate how much space we have to plot
	let bounds = svg.node().getBoundingClientRect();
	let plotWidth = bounds.width - margin.right - margin.left;
	let plotHeight = bounds.height - margin.top - margin.bottom;


	let countScale = d3.scaleLinear()
		.domain([countMin, countMax])
		.range([plotHeight, 0])
		.nice(); // rounds the domain a bit for nicer output


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

	// try using these scales in the console
	console.log("using count scale:", [countScale(countMin), countScale(countMax)]);
	console.log("using period scale:", [periodScale(periodMin), periodScale(periodMax)]);

	// we are actually going to draw on the "plot area"
	let plot = svg.append("g").attr("id", "plot");
	plot.attr("transform", `translate(${margin.left}, ${margin.top})`);

	console.log("Got here")
	console.assert(plot.size() == 1);

	// now lets draw our x- and y-axis
	// these require our x (letter) and y (count) scales
	let xAxis = d3.axisBottom(periodScale);
	let yAxis = d3.axisLeft(countScale);
	yAxis.tickFormat(d3.formatPrefix(".0", 1e6));

	let xGroup = plot.append("g").attr("id", "x-axis");
	xGroup.call(xAxis);

	// notice it is at the top of our svg
	// we need to translate/shift it down to the bottom
	xGroup.attr("transform", "translate(0," + plotHeight + ")");

	// do the same for our y axix
	let yGroup = plot.append("g").attr("id", "y-axis");
	yGroup.call(yAxis);
	// yGroup.attr("transform", `translate(${margin.left}, 0)`);

	/*
	 * we need our data as an array of key, value pairs before binding
	 */

	let getPairs = function(d) {
		let ret = [];

		for (var tmp of d) {
			ret.push([tmp.key, tmp.values[0].count+tmp.values[1].count]);
		}

		return ret;
	}

	let pairs = getPairs(data);

	let bars = plot.selectAll("rect")
		.data(pairs, function(d) { return d[0]; });

	// we use the enter() selection to add new bars for new data
	bars.enter().append("rect")
		.attr("class", "bar")
		.attr("width", periodScale.bandwidth())
		.attr("x", d => periodScale(d[0]))
		.attr("y", d => countScale(d[1]))
		.attr("height", d => plotHeight - countScale(d[1]))
		.each(function(d, i, nodes) {
			console.log("Added bar for:", d[0]);
		});

	// so we can access some of these elements later...
	// add them to our chart global
	chart.plotWidth = plotWidth;
	chart.plotHeight = plotHeight;

	chart.xAxis = xAxis;
	chart.yAxis = yAxis;

	chart.countScale = countScale;
	chart.periodScale = periodScale;
};

