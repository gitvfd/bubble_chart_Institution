/* bubbleChart creation function. Returns a function that will
 * instantiate a new bubble chart given a DOM element to display
 * it in and a dataset to visualize.
 *
 * Organization and style inspired by:
 * https://bost.ocks.org/mike/chart/
 *
 */
function bubbleChart() {
  // Constants for sizing
  var width = 1240;
  var height = 940;

  // tooltip for mouseover functionality
  var tooltip = floatingTooltip('institution_tooltip', 240);

  // Locations to move bubbles towards, depending
  // on which view mode is selected.
  var center = { x: width / 2, y: height / 2 };

  var yearCenters = {
    2014: { x: width / 3, y: height / 2 },
    2015: { x: width / 2, y: height / 2 },
    2016: { x: 2 * width / 3, y: height / 2 }
  };

  // X locations of the year titles.
  var yearsTitleX = {
    2014: 160,
    2015: width / 2,
    2016: width - 160
  };

  // @v4 strength to apply to the position forces
  var forceStrength = 0.05;

  // These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  // Charge function that is called for each node.
  // As part of the ManyBody force.
  // This is what creates the repulsion between nodes.
  //
  // Charge is proportional to the diameter of the
  // circle (which is stored in the radius attribute
  // of the circle's associated data.
  //
  // This is done to allow for accurate collision
  // detection with nodes of different sizes.
  //
  // Charge is negative because we want nodes to repel.
  // @v4 Before the charge was a stand-alone attribute
  //  of the force layout. Now we can use it as a separate force!
  function charge(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  // Here we create a force layout and
  // @v4 We create a force simulation now and
  //  add forces to it.
  var simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  // @v4 Force starts up automatically,
  //  which we don't want as there aren't any nodes yet.
  simulation.stop();

  // Nice looking colors - no reason to buck the trend
  // @v4 scales now have a flattened naming scheme
  var fillColor = d3.scaleOrdinal()
    .domain(["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Bhutan","Bolivia","Bosnia and Herzegovina","Brazil","Brunei Darussalam","Bulgaria","Burkina Faso","Cambodia","Cameroon","Canada","Chile","China, People<U+2019>s Republic","Chinese Taipei","Colombia","Congo","Costa Rica","Croatia","Cyprus","Czech Republic","Denmark","Dominican Republic","Egypt","El Salvador","Estonia","Ethiopia","Faroe Islands","Fiji","Finland","Former Yugoslav Republic of Macedonia (FYROM)","France","Georgia","Germany","Greece","Hong Kong, China","Hungary","Iceland","India","Indonesia","Iran, Islamic Republic of","Ireland","Israel","Italy","Jamaica","Japan","Kazakhstan","Kenya","Korea, Democratic People's Republic of","Korea, Republic of","Kuwait","Kyrgyzstan","Latvia","Lebanon","Lesotho","Liechtenstein","Lithuania","Luxembourg","MTQ","Macau, China","Madagascar","Malaysia","Maldives","Mali","Malta","Mauritius","Mexico","Moldova, Republic of","Mongolia","Morocco","Mozambique","Myanmar","Nepal","Netherlands","New Zealand","Nigeria","Norway","Oman","Pakistan","Palestinian Authority","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russian Federation","Rwanda","Samoa","Saudi Arabia","Serbia","Singapore","Slovak Republic","Slovenia","Somalia","South Africa","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Tanzania, United Republic of","Thailand","Tokelau","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uzbekistan","Venezuela","Viet Nam","Zimbabwe"])
    .range(['#7fffd4','#7effd3','#7dffd1','#7dffd0','#7cffcf','#7bffce','#7bffcc','#7affcb','#7afeca','#79fec8','#79fec7','#79fec6','#79fec4','#78fdc3','#78fdc1','#78fdc0','#78fdbf','#79fcbd','#79fcbc','#79fcbb','#79fbb9','#7afbb8','#7afab6','#7afab5','#7bf9b3','#7cf9b2','#7cf8b1','#7df8af','#7ef7ae','#7ef7ac','#7ff6ab','#80f6a9','#81f5a8','#82f4a6','#83f4a5','#84f3a3','#85f2a2','#86f1a0','#87f19f','#88f09d','#89ef9c','#8aee9a','#8cee99','#8ded97','#8eec96','#8feb94','#91ea93','#92e991','#93e890','#95e78e','#96e68d','#97e58b','#99e489','#9ae388','#9ce286','#9de185','#9ee083','#a0df82','#a1dd80','#a3dc7e','#a4db7d','#a6da7b','#a7d979','#a9d778','#aad676','#acd575','#add373','#aed271','#b0d170','#b1cf6e','#b3ce6c','#b4cc6b','#b6cb69','#b7c967','#b9c866','#bac664','#bcc562','#bdc361','#bfc15f','#c0c05d','#c1be5c','#c3bc5a','#c4bb58','#c6b957','#c7b755','#c9b553','#cab351','#cbb150','#cdaf4e','#cead4c','#d0ab4a','#d1a949','#d2a747','#d4a545','#d5a343','#d6a142','#d89f40','#d99c3e','#da9a3c','#dc983b','#dd9539','#de9337','#e09035','#e18e33','#e28b32','#e38930','#e5862e','#e6832c','#e7802a','#e87d28','#ea7a26','#eb7725','#ec7423','#ed7021','#ee6d1f','#f0691d','#f1661b','#f26219','#f35e17','#f45915','#f55513','#f65011','#f74b0e','#f9450c','#fa3f0a','#fb3807','#fc3005','#fd2603','#fe1902','#ff0000']);


  /*
   * This data manipulation function takes the raw data from
   * the CSV file and converts it into an array of node objects.
   * Each node will store data and visualization values to visualize
   * a bubble.
   *
   * rawData is expected to be an array of data objects, read in from
   * one of d3's loading functions like d3.csv.
   *
   * This function returns the new node array, with a node in that
   * array for each element in the rawData input.
   */
  function createNodes(rawData) {
    // Use the max total_amount in the data as the max in the scale's domain
    // note we have to ensure the total_amount is a number.
    var maxAmount = d3.max(rawData, function (d) { return +d.total; });

    // Sizes bubbles based on area.
    // @v4: new flattened scale names.
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([1, 30])
      .domain([0, maxAmount]);

    // Use map() to convert raw data into node data.
    // Checkout http://learnjsdata.com/ for more on
    // working with data.
    var myNodes = rawData.map(function (d) {
      return {
        id: d.id,
        radius: radiusScale(+d.total),
        value: +d.total,
        name: d.InstitutionName,
        country:d.Country,
        year: d.Year,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.value - a.value; });

    return myNodes;
  }

  /*
   * Main entry point to the bubble chart. This function is returned
   * by the parent closure. It prepares the rawData for visualization
   * and adds an svg element to the provided selector and starts the
   * visualization creation process.
   *
   * selector is expected to be a DOM element or CSS selector that
   * points to the parent element of the bubble chart. Inside this
   * element, the code will add the SVG continer for the visualization.
   *
   * rawData is expected to be an array of data objects as provided by
   * a d3 loading function like d3.csv.
   */
  var chart = function chart(selector, rawData) {
    // convert raw data into nodes data
    nodes = createNodes(rawData);

    // Create a SVG element inside the provided selector
    // with desired size.
    svg = d3.select(selector)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Bind nodes data to what will become DOM elements to represent them.
    bubbles = svg.selectAll('.bubble')
      .data(nodes, function (d) { return d.id; });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.
    var bubblesE = bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return fillColor(d.country); })
      .attr('stroke', function (d) { return d3.rgb(fillColor(d.country)).darker(); })
      .attr('stroke-width', 2)
      .on('mouseover', showDetail)
      .on('mouseout', hideDetail);

    // @v4 Merge the original empty selection and the enter selection
    bubbles = bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
    simulation.nodes(nodes);

    // Set initial layout to single group.
    groupBubbles();
  };

  /*
   * Callback function that is called after every tick of the
   * force simulation.
   * Here we do the acutal repositioning of the SVG circles
   * based on the current x and y values of their bound node data.
   * These x and y values are modified by the force simulation.
   */
  function ticked() {
    bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

  /*
   * Provides a x value for each node to be used with the split by year
   * x force.
   */
  function nodeYearPos(d) {
    return yearCenters[d.year].x;
  }


  /*
   * Sets visualization in "single group mode".
   * The year labels are hidden and the force layout
   * tick function is set to move all nodes to the
   * center of the visualization.
   */
  function groupBubbles() {
    hideYearTitles();

    // @v4 Reset the 'x' force to draw the bubbles to the center.
    simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }


  /*
   * Sets visualization in "split by year mode".
   * The year labels are shown and the force layout
   * tick function is set to move nodes to the
   * yearCenter of their data's year.
   */
  function splitBubbles() {
    showYearTitles();

    // @v4 Reset the 'x' force to draw the bubbles to their year centers
    simulation.force('x', d3.forceX().strength(forceStrength).x(nodeYearPos));

    // @v4 We can reset the alpha value and restart the simulation
    simulation.alpha(1).restart();
  }

  /*
   * Hides Year title displays.
   */
  function hideYearTitles() {
    svg.selectAll('.year').remove();
  }

  /*
   * Shows Year title displays.
   */
  function showYearTitles() {
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    var yearsData = d3.keys(yearsTitleX);
    var years = svg.selectAll('.year')
      .data(yearsData);

    years.enter().append('text')
      .attr('class', 'year')
      .attr('x', function (d) { return yearsTitleX[d]; })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) { return d; });
  }


  /*
   * Function called on mouseover to display the
   * details of a bubble in the tooltip.
   */
  function showDetail(d) {
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Title: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Country: </span><span class="value">' +
                  d.country +
                  '</span><br/>' +
                  '<span class="name">Amount: </span><span class="value">' +
                  addCommas(d.value) +
                  ' downloads</span><br/>' +
                  '<span class="name">Year: </span><span class="value">' +
                  d.year +
                  '</span>';

    tooltip.showTooltip(content, d3.event);
  }

  /*
   * Hides tooltip
   */
  function hideDetail(d) {
    // reset outline
    d3.select(this)
      .attr('stroke', d3.rgb(fillColor(d.Country)).darker());

    tooltip.hideTooltip();
  }

  /*
   * Externally accessible function (this is attached to the
   * returned chart function). Allows the visualization to toggle
   * between "single group" and "split by year" modes.
   *
   * displayName is expected to be a string and either 'year' or 'all'.
   */
  chart.toggleDisplay = function (displayName) {
    if (displayName === 'year') {
      splitBubbles();
    } else {
      groupBubbles();
    }
  };


  // return the chart function from closure.
  return chart;
}

/*
 * Below is the initialization code as well as some helper functions
 * to create a new bubble chart instance, load the data, and display it.
 */

var myBubbleChart = bubbleChart();

/*
 * Function called once data is loaded from CSV.
 * Calls bubble chart function to display inside #vis div.
 */
function display(error, data) {
  if (error) {
    console.log(error);
  }

  myBubbleChart('#vis', data);
}

/*
 * Sets up the layout buttons to allow for toggling between view modes.
 */
function setupButtons() {
  d3.select('#toolbar')
    .selectAll('.button')
    .on('click', function () {
      // Remove active class from all buttons
      d3.selectAll('.button').classed('active', false);
      // Find the button just clicked
      var button = d3.select(this);

      // Set it as the active button
      button.classed('active', true);

      // Get the id of the button
      var buttonId = button.attr('id');

      // Toggle the bubble chart based on
      // the currently clicked button.
      myBubbleChart.toggleDisplay(buttonId);
    });
}

/*
 * Helper function to convert a number into a string
 * and add commas to it to improve presentation.
 */
function addCommas(nStr) {
  nStr += '';
  var x = nStr.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }

  return x1 + x2;
}

// Load the data.
d3.csv('data/Institution_data.csv', display);

// setup the buttons.
setupButtons();
