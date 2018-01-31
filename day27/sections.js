d3.tsv('data.tsv', display);

function display(data) {
  // create a new plot and
  // display it
  var plot = scrollVis();
  d3.select('#vis')
    .datum(data)
    .call(plot);

  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
  scroll.on('active', function (index) {
    console.log(index)
    // highlight current step text
    d3.selectAll('.step')
      .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });

    // activate current section
    plot.activate(index);
  });

  scroll.on('progress', function (index, progress) {
    plot.update(index, progress);
  });
}


var scrollVis = function () {

  var width = 600;
  var height = 600;
  var margin = { top: 0, left: 20, bottom: 40, right: 10 };

  var lastIndex = -1;
  var activeIndex = 0;

  var squareSize = 6;
  var squarePad = 2;
  var numPerRow = width / (squareSize + squarePad);

  var svg = null;
  var g = null;

  var activateFunctions = [];
  var updateFunctions = [];

  var chart = function(selection) {
    selection.each(function (rawData) {

      svg = d3.select(this).selectAll('svg').data([wordData])
      var svgE = svg.enter().append('svg');
      svg = svg.merge(svgE);

      svg.attr('width', width + margin.left + margin.right);
      svg.attr('height', height + margin.top + margin.bottom);

      svg.append('g');

      g = svg.select('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      var wordData = getWords(rawData);
      console.log(wordData)

      setupVis(wordData);
      setupSections();
    })
  }

  function getWords(rawData) {

    return rawData.map(function (d, i) {
      // is this word a filler word?
      d.filler = (d.filler === '1') ? true : false;
      // time in seconds word was spoken
      d.time = +d.time;
      // time in minutes word was spoken
      d.min = Math.floor(d.time / 60);

      // positioning for square visual
      // stored here to make it easier
      // to keep track of.
      d.col = i % numPerRow;
      d.x = d.col * (squareSize + squarePad);
      d.row = Math.floor(i / numPerRow);
      d.y = d.row * (squareSize + squarePad);
      return d;
    });


  }

  var setupVis = function(wordData) {

    var squares = g.selectAll('.square').data(wordData, function (d) { return d.word; });
    var squaresE = squares.enter()
      .append('rect')
      .classed('square', true);

    squares = squares.merge(squaresE)
      .attr('width', squareSize)
      .attr('height', squareSize)
      .attr('fill', '#fff')
      .classed('fill-square', function (d) { return d.filler ? true : false; })
      .classed('noFill-square', function (d) { return !d.filler ? true : false; })
      .attr('x', function (d) { return d.x;})
      .attr('y', function (d) { return d.y;})
      .attr('opacity', 0);
  }

  var setupSections = function () {
    activateFunctions[0] = showGrid;
    activateFunctions[1] = highlightGrid;
    activateFunctions[2] = showSelectedOnly;

    for (var i = 0; i < 3; i++) {
    updateFunctions[i] = function () {};
    }
  }

  function showGrid() {
      g.selectAll('.square')
        .transition()
        // .duration(3000)
        .delay(function (d) {
          return 0.5 * (d.time)
        })
        .attr('width', squareSize)
        .attr('height', squareSize)
        .attr('opacity', 1.0)
        .attr('fill', '#141414');
    }

    function highlightGrid() {

      g.selectAll('.square')
        .attr('width', squareSize)
        .attr('height', squareSize)
        .attr('x', function (d) { return d.x;})
        .attr('y', function (d) { return d.y;})
        .transition()
        .duration(0)
        .attr('opacity', 1.0)
        .attr('fill', '#141414');

      // use named transition to ensure
      // move happens even if other
      // transitions are interrupted.
      g.selectAll('.fill-square')
        .transition('move-fills')
        .duration(0)
        .attr('x', function (d) {
          return d.x;
        })
        .attr('y', function (d) {
          return d.y;
        });

      g.selectAll('.fill-square')
        .transition()
        .duration(2000)
        .attr('opacity', 1.0)
        .attr('fill', function (d) {
          if(d.word == "um") {
             return "#F56476"
          } else if (d.word == "ah") {
            return "#DFBBB1"
          } else if (d.word == "uh") {
            return "#E43F6F"
          }
        });
      }

    function showSelectedOnly() {
      g.selectAll('.noFill-square')
        .transition()
        .duration(1000)
        .attr('opacity', 0)
        // .attr('fill', function (d) { return d.filler ? 'yellow' : '#fff'; });

        var ah=0;
        var uh=0;
        var um=0;

        g.selectAll('.fill-square')
          .transition('move-fills')
          .delay(1000)
          .duration(1500)
          .attr('x', function (d) {
          if(d.word == "um") {
            um++;
             return um*squareSize;
          } else if (d.word == "ah") {
            ah++;
            return ah*squareSize;
          } else if (d.word == "uh") {
            uh++;
            return uh*squareSize;
          }
                })
          .attr('y', function (d) {
            if(d.word == "um") {
               // um++;
               return height/2 - 200;
            } else if (d.word == "ah") {
               // ah++;
              return height/2;
            } else if (d.word == "uh") {
               // uh++;
              return height/2 + 200;
            }
          })
          // .attr('width', function (d) {
          //   if(d.word == "um") {
          //      return squareSize * um
          //   } else if (d.word == "ah") {
          //     return squareSize * ah
          //   } else if (d.word == "uh") {
          //     return squareSize * uh
          //   }
          // })
          // .attr('height', function (d) {
          //   return squareSize
          // });
    }


    chart.activate = function (index) {
      activeIndex = index;
      var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
      var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
      scrolledSections.forEach(function (i) {
        activateFunctions[i]();
      });
      lastIndex = activeIndex;
    };

    chart.update = function (index, progress) {
      updateFunctions[index](progress);
    };

    return chart;
}
