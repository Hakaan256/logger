$(document).ready((event) => {
    $('.js-example-basic-single').select2() //initialize select boxes
    $('#sessionSelectAll').select2({ disabled: true })
    let graphLeft = $('#graphLeft')[0]
    let graphRight = $('#graphRight')[0]
    let goalsGraph1 = $('#goalsGraph1')[0]
    let goalsGraph2 = $('#goalsGraph2')[0]

    let graphLeftAll = $('#graphLeftAll')[0]
    let graphRightAll = $('#graphRightAll')[0]
    let goalsGraph1All = $('#goalsGraph1All')[0]
    let goalsGraph2All = $('#goalsGraph2All')[0]
    
    $(document).on('change', '#gameSelect', (event) => {
        event.preventDefault()
        on()
        $('#levelSelect').empty()
        $('#levelSelectAll').empty()
        $('#sessionSelect').empty()
        $.get('responsePage.php', { 'gameID': $('#gameSelect').val() }, (data, status, jqXHR) => {
            if (data.levels !== null) {
                $('#sessions').text(data.numSessions + ' sessions available')

                // initialization of single tab
                for (let i = 0; i < data.numSessions; i++) {
                    $('#sessionSelect').append($('<option>', { value:data.sessions[i], text:data.sessions[i]}))
                }
                $('#sessionSelect').val('18020410454796070') // the most interesting session
                for (let i = 0; i < data.levels.length; i++) {
                    $('#levelSelect').append($('<option>', { value:data.levels[i], text:data.levels[i]}))
                }
                let opt = $('#levelSelect option').sort(function (a,b) { return a.value.toUpperCase().localeCompare(b.value.toUpperCase(), {}, {numeric:true}) })

                $('#levelSelect').append(opt)
                $('#levelSelect').val($('#levelSelect option:first').val())

                selectSession(event)

                // do initialization of all tab
                for (let i = 0; i < data.levels.length; i++) {
                    $('#levelSelectAll').append($('<option>', { value:data.levels[i], text:data.levels[i]}))
                }
                let optAll = $('#levelSelectAll option').sort(function (a,b) { return a.value.toUpperCase().localeCompare(b.value.toUpperCase(), {}, {numeric:true}) })

                $('#levelSelectAll').append(optAll)
                $('#levelSelectAll').val($('#levelSelectAll option:first').val())

                selectGameAll(event)
                getWavesDataAll()
            } else {
                off()
                hideError()
            }
        }, 'json').error((jqXHR, textStatus, errorThrown) => {
            off()
            showError(jqXHR.responseText)
        })
    })

    $(document).on('change', '#sessionSelect', (event) => {
        selectSession(event)
    })

    function selectSession(event) {
        if (event) event.preventDefault()
        on()
        $.get('responsePage.php', { 'gameID': $('#gameSelect').val(), 'sessionID': $('#sessionSelect').val() }, (data, status, jqXHR) => {
            $("#scoreDisplay").html(data.numCorrect + " / " + data.numQuestions)
            hideError()
            $.get('responsePage.php', { 'gameID': $('#gameSelect').val(), 'sessionID': $('#sessionSelect').val(), 'level': $('#levelSelect').val() }, (data, status, jqXHR) => {
                if ($('#gameSelect').val() === "WAVES") {
                    let dataObj = {data:JSON.parse(JSON.stringify(data.event_data)), times:data.times}
                    drawWavesChart(dataObj)
                    getWavesData()
                }
                off()
                hideError()
              }, 'json').error((jqXHR, textStatus, errorThrown) => {
                  off()
                  showError(jqXHR.responseText)
              })
        }, 'json').error((jqXHR, textStatus, errorThrown) => {
            off()
            showError(jqXHR.responseText)
        })
    }

    function selectGameAll(event) {
        if (event) event.preventDefault()
        on()
        $.get('responsePage.php', { 'gameID': $('#gameSelect').val(), 'isAll': true }, (data, status, jqXHR) => {
            $('#scoreDisplayAll').html(data.totalNumCorrect + ' / ' + data.totalNumQuestions + ' (' + (100*data.totalNumCorrect/data.totalNumQuestions).toFixed(2) + '%)')
            if ($('#gameSelect').val() === "WAVES") {
                getWavesDataAll()
            }
            hideError()
            off()
        }, 'json').error((jqXHR, textStatus, errorThrown) => {
            off()
            showError(jqXHR.responseText)
        })
    }

    $(document).on('change', '#levelSelect', (event) => {
        event.preventDefault()
        if ($('#levelSelect').val() !== $('#levelSelectAll').val()) {
            on()
            $('#levelSelectAll').val($('#levelSelect').val()).trigger('change')
            $.get('responsePage.php', { 'gameID': $('#gameSelect').val(), 'sessionID': $('#sessionSelect').val(), 'level': $('#levelSelect').val()}, (data, status, jqXHR) => {
                if ($('#gameSelect').val() === "WAVES") {
                    let dataObj = {data:JSON.parse(JSON.stringify(data.event_data)), times:data.times}
                    drawWavesChart(dataObj)
                    getWavesData()
                }
                off()
                hideError()
            }, 'json').error((jqXHR, textStatus, errorThrown) => {
                off()
                showError(jqXHR.responseText)
            })
        }
    })

    $(document).on('change', '#levelSelectAll', (event) => {
        event.preventDefault()
        if ($('#levelSelect').val() !== $('#levelSelectAll').val()) {
            on()
            $('#levelSelect').val($('#levelSelectAll').val()).trigger('change')
            $.get('responsePage.php', { 'isAll': true, 'gameID': $('#gameSelect').val(), 'level': $('#levelSelectAll').val()}, (data, status, jqXHR) => {
                if ($('#gameSelect').val() === "WAVES") {
                    let dataObj = {data:JSON.parse(JSON.stringify(data.event_data)), times:data.times}
                    //drawWavesChartAll(dataObj)
                    getWavesDataAll()
                }
                off()
                hideError()
            }, 'json').error((jqXHR, textStatus, errorThrown) => {
                off()
                showError(jqXHR.responseText)
            })
        }
    })

    function getWavesData() {
        $.get('responsePage.php', { 'isBasicFeatures': true, 'gameID': $('#gameSelect').val(), 'sessionID': $('#sessionSelect').val()}, (data, status, jqXHR) => {
            if ($('#gameSelect').val() === "WAVES") {
                let dataObj = {data:JSON.parse(JSON.stringify(data.event_data)), times:data.times, events:JSON.parse(JSON.stringify(data.events)), levels:data.levels}
                $('#basicFeatures').empty()
                // Variables holding "basic features" for waves game, filled by database data
                let avgTime
                let totalTime = 0
                let numFails
                let numMovesPerChallenge
                let totalMoves = 0
                let avgMoves
                let moveTypeChangesPerLevel
                let moveTypeChangesTotal = 0
                let moveTypeChangesAvg
                let knobStdDevs
                let knobNumStdDevs
                let knobAmtsTotal = 0
                let knobAmtsAvg
                let knobSumTotal = 0
                let knobSumAvg

                let timesList = $('<ul></ul>').attr('id', 'times').addClass('collapse').css('font-size', '18px')
                $('#basicFeatures').append($(`<span><li>Times: <a href='#times' data-toggle='collapse' id='timesCollapseBtn' class='collapseBtn'>[+]</a></li></span>`).append(timesList)
                    .on('hide.bs.collapse', () => {$('#timesCollapseBtn').html('[+]')})
                    .on('show.bs.collapse', () => {$('#timesCollapseBtn').html('[−]')}))
                let failsList = $('<ul></ul>').attr('id', 'fails').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeatures').append($(`<span><li style='margin-top:5px'>Failures: <a href='#fails' data-toggle='collapse' id='failsCollapseBtn' class='collapseBtn'>[+]</a></li></span>`).append(failsList)
                    .on('hide.bs.collapse', () => {$('#failsCollapseBtn').html('[+]')})
                    .on('show.bs.collapse', () => {$('#failsCollapseBtn').html('[−]')}))
                let movesList = $('<ul></ul>').attr('id', 'moves').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeatures').append($(`<span><li style='margin-top:5px'>Number of moves: <a href='#moves' data-toggle='collapse' id='movesCollapseBtn' class='collapseBtn'>[+]</a></li></span>`).append(movesList)
                    .on('hide.bs.collapse', () => {$('#movesCollapseBtn').html('[+]')})
                    .on('show.bs.collapse', () => {$('#movesCollapseBtn').html('[−]')}))
                let typesList = $('<ul></ul>').attr('id', 'types').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeatures').append($(`<span><li style='margin-top:5px'>Move type changes: <a href='#types' data-toggle='collapse' id='typesCollapseBtn' class='collapseBtn'>[+]</a></li></span>`).append(typesList)
                    .on('hide.bs.collapse', () => {$('#typesCollapseBtn').html('[+]')})
                    .on('show.bs.collapse', () => {$('#typesCollapseBtn').html('[−]')}))
                let stdDevList = $('<ul></ul>').attr('id', 'stdDevs').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeatures').append($(`<span><li style='margin-top:5px'>Knob std devs (avg): <a href='#stdDevs' data-toggle='collapse' id='stdDevsCollapseBtn' class='collapseBtn'>[+]</a></li></span>`).append(stdDevList)
                    .on('hide.bs.collapse', () => {$('#stdDevsCollapseBtn').html('[+]')})
                    .on('show.bs.collapse', () => {$('#stdDevsCollapseBtn').html('[−]')}))
                let amtsList = $('<ul></ul>').attr('id', 'amts').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeatures').append($(`<span><li style='margin-top:5px'>Knob max-min (avg): <a href='#amts' data-toggle='collapse' id='amtsCollapseBtn' class='collapseBtn'>[+]</a></li></span>`).append(amtsList)
                    .on('hide.bs.collapse', () => {$('#amtsCollapseBtn').html('[+]')})
                    .on('show.bs.collapse', () => {$('#amtsCollapseBtn').html('[−]')}))
                let amtsTotalList = $('<ul></ul>').attr('id', 'amtsTotal').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeatures').append($(`<span><li style='margin-top:5px'>Knob max-min (total): <a href='#amtsTotal' data-toggle='collapse' id='amtsTotalCollapseBtn' class='collapseBtn'>[+]</a></li></span>`).append(amtsTotalList)
                    .on('hide.bs.collapse', () => {$('#amtsTotalCollapseBtn').html('[+]')})
                    .on('show.bs.collapse', () => {$('#amtsTotalCollapseBtn').html('[−]')}))
                
                if (dataObj.times !== null) {
                    // Basic features stuff
                    let levelStartTime, levelEndTime, lastSlider = null, startIndices = [], endIndices = [], moveTypeChangesPerLevel = [], knobStdDevs = [], knobNumStdDevs = [], knobAmts = []
                    numFails = new Array($('#levelSelect option').size()).fill(0)
                    numMovesPerChallenge = new Array($('#levelSelect option').size())
                    moveTypeChangesPerLevel = new Array($('#levelSelect option').size()).fill(0)
                    knobStdDevs = new Array($('#levelSelect option').size()).fill(0)
                    knobNumStdDevs = new Array($('#levelSelect option').size()).fill(0)
                    knobAmts = new Array($('#levelSelect option').size()).fill(0)
                    startIndices = new Array($('#levelSelect option').size()).fill(undefined)
                    endIndices = new Array($('#levelSelect option').size()).fill(undefined)
                    let indicesToSplice = new Array($('#levelSelect option').size())
                    for (let i = 0; i < numMovesPerChallenge.length; i++) {
                        numMovesPerChallenge[i] = []
                        indicesToSplice[i] = []
                    }
                    for (let i = 0; i < dataObj.times.length; i++) {
                        if (!(endIndices[dataObj.levels[i]])) {
                            let dataJson = JSON.parse(dataObj.data[i])
                            if (dataJson !== null) {
                                if (dataJson.event_custom !== 'SLIDER_MOVE_RELEASE' && dataJson.event_custom !== 'ARROW_MOVE_RELEASE') {
                                    indicesToSplice[dataObj.levels[i]].push(i)
                                }
                            }
                            if (dataObj.events[i] === 'BEGIN') {
                                if (startIndices[dataObj.levels[i]] === undefined) { // check this space isn't filled by a previous attempt on the same level
                                    startIndices[dataObj.levels[i]] = i
                                }
                            } else if (dataObj.events[i] === 'COMPLETE') {
                                if (endIndices[dataObj.levels[i]] === undefined) {
                                    endIndices[dataObj.levels[i]] = i
                                }
                            } else if (dataObj.events[i] === 'FAIL') {
                                numFails[dataObj.levels[i]]++
                            } else if (dataObj.events[i] === 'CUSTOM' && (dataJson.event_custom === 'SLIDER_MOVE_RELEASE' || dataJson.event_custom === 'ARROW_MOVE_RELEASE')) {
                                if (lastSlider !== dataJson.slider) {
                                    moveTypeChangesPerLevel[dataObj.levels[i]]++
                                }
                                lastSlider = dataJson.slider
                                numMovesPerChallenge[dataObj.levels[i]].push(i)
                                if (dataJson.event_custom === 'SLIDER_MOVE_RELEASE') { // arrows don't have std devs
                                    knobNumStdDevs[dataObj.levels[i]]++
                                    knobStdDevs[dataObj.levels[i]] += dataJson.stdev_val
                                    knobAmts[dataObj.levels[i]] += (dataJson.max_val-dataJson.min_val)
                                }
                            }
                        }
                    }
                    for (let i = 0; i < indicesToSplice; i++) {
                        for (let j = indicesToSplice[i].length-1; j > 0; j--) {
                            numMovesPerChallenge[i].splice(indicesToSplice[i, j], 1)
                        }
                    }
                    
                    for (let i in Object.keys(startIndices)) {
                        if (startIndices[i] !== undefined) {
                            let levelTime = "-";
                            if (dataObj.times[endIndices[i]] && dataObj.times[startIndices[i]]) {
                                levelStartTime = new Date(dataObj.times[startIndices[i]].replace(/-/g, "/"))
                                levelEndTime = new Date(dataObj.times[endIndices[i]].replace(/-/g, "/"))
                                levelTime = (levelEndTime.getTime() - levelStartTime.getTime()) / 1000
                                totalTime += levelTime
                            }

                            totalMoves += numMovesPerChallenge[i].length
                            moveTypeChangesTotal += moveTypeChangesPerLevel[i]
                            if (knobNumStdDevs[i] !== 0) {
                                knobAmtsTotal += (knobAmts[i]/knobNumStdDevs[i])
                            }
                            
                            knobSumTotal += knobAmts[i]
    
                            // append times
                            $('#times').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${levelTime} sec</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append fails
                            $('#fails').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${numFails[i]}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append moves
                            $('#moves').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${numMovesPerChallenge[i].length}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                            
                            // append types
                            $('#types').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${moveTypeChangesPerLevel[i]}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append std devs
                            let knobAvgStdDev
                            if (knobNumStdDevs[i] === 0) {
                                knobAvgStdDev = 0
                            } else {
                                knobAvgStdDev = (knobStdDevs[i]/knobNumStdDevs[i])
                            }
                            $('#stdDevs').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${knobAvgStdDev.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append knob amounts
                            let knobAvgAmt
                            if (knobNumStdDevs[i] === 0) {
                                knobAvgAmt = 0
                            } else {
                                knobAvgAmt = (knobAmts[i]/knobNumStdDevs[i])
                            }
                            $('#amts').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${knobAvgAmt.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append knob total amounts
                            $('#amtsTotal').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${(knobAmts[i]).toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                        }
                    }
                    avgTime = totalTime / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#times').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#times').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${totalTime} sec</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#times').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${avgTime.toFixed(2)} sec</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    avgMoves = totalMoves / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#moves').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#moves').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${totalMoves}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#moves').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${avgMoves.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    moveTypeChangesAvg = moveTypeChangesTotal / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#types').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#types').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${moveTypeChangesTotal}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#types').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${moveTypeChangesAvg.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    knobAmtsAvg = knobAmtsTotal / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#amts').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#amts').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${knobAmtsTotal.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#amts').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${knobAmtsAvg.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    knobSumAvg = knobSumTotal / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#amtsTotal').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#amtsTotal').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${knobSumTotal.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#amtsTotal').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${knobSumAvg.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    drawWavesGoals(dataObj, numMovesPerChallenge[$('#levelSelect').val()])
                }
            }
            off()
            hideError()
        }, 'json').error((jqXHR, textStatus, errorThrown) => {
            off()
            showError(jqXHR.responseText)
        })
    }

    function getWavesDataAll() {
        $.get('responsePage.php', { 'isAll': true, 'isBasicFeatures': true, 'gameID': $('#gameSelect').val(), 'level': $('#levelSelectAll').val()}, (data, status, jqXHR) => {
            if ($('#gameSelect').val() === "WAVES") {
                let dataObj = { 
                    data: JSON.parse(JSON.stringify(data.event_data)),
                    times: data.times,
                    events: JSON.parse(JSON.stringify(data.events)),
                    levels: data.levels,
                    sessions: data.sessions,
                    sessionNumEvents: data.sessionNumEvents
                }
                $('#basicFeaturesAll').empty()
                // Variables holding "basic features" for waves game, filled by database data
                let avgTime
                let totalTime = 0
                let numFails
                let numMovesPerChallenge
                let totalMoves = 0
                let avgMoves
                let moveTypeChangesPerLevel
                let moveTypeChangesTotal = 0
                let moveTypeChangesAvg
                let knobStdDevs
                let knobNumStdDevs
                let knobAmtsTotal = 0
                let knobAmtsAvg
                let knobSumTotal = 0
                let knobSumAvg

                let timesList = $('<ul></ul>').attr('id', 'timesAll').addClass('collapse').css('font-size', '18px')
                $('#basicFeaturesAll').append($(`<span><li>Times: <a href='#times' data-toggle='collapse' id='timesCollapseBtnAll' class='collapseBtnAll'>[+]</a></li></span>`).append(timesList)
                    .on('hide.bs.collapse', () => {$('#timesCollapseBtnAll').html('[+]')})
                    .on('show.bs.collapse', () => {$('#timesCollapseBtnAll').html('[−]')}))
                let failsList = $('<ul></ul>').attr('id', 'failsAll').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeaturesAll').append($(`<span><li style='margin-top:5px'>Failures: <a href='#fails' data-toggle='collapse' id='failsCollapseBtnAll' class='collapseBtnAll'>[+]</a></li></span>`).append(failsList)
                    .on('hide.bs.collapse', () => {$('#failsCollapseBtnAll').html('[+]')})
                    .on('show.bs.collapse', () => {$('#failsCollapseBtnAll').html('[−]')}))
                let movesList = $('<ul></ul>').attr('id', 'movesAll').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeaturesAll').append($(`<span><li style='margin-top:5px'>Number of moves: <a href='#moves' data-toggle='collapse' id='movesCollapseBtnAll' class='collapseBtnAll'>[+]</a></li></span>`).append(movesList)
                    .on('hide.bs.collapse', () => {$('#movesCollapseBtnAll').html('[+]')})
                    .on('show.bs.collapse', () => {$('#movesCollapseBtnAll').html('[−]')}))
                let typesList = $('<ul></ul>').attr('id', 'typesAll').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeaturesAll').append($(`<span><li style='margin-top:5px'>Move type changes: <a href='#types' data-toggle='collapse' id='typesCollapseBtnAll' class='collapseBtnAll'>[+]</a></li></span>`).append(typesList)
                    .on('hide.bs.collapse', () => {$('#typesCollapseBtnAll').html('[+]')})
                    .on('show.bs.collapse', () => {$('#typesCollapseBtnAll').html('[−]')}))
                let stdDevList = $('<ul></ul>').attr('id', 'stdDevsAll').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeaturesAll').append($(`<span><li style='margin-top:5px'>Knob std devs (avg): <a href='#stdDevs' data-toggle='collapse' id='stdDevsCollapseBtnAll' class='collapseBtnAll'>[+]</a></li></span>`).append(stdDevList)
                    .on('hide.bs.collapse', () => {$('#stdDevsCollapseBtnAll').html('[+]')})
                    .on('show.bs.collapse', () => {$('#stdDevsCollapseBtnAll').html('[−]')}))
                let amtsList = $('<ul></ul>').attr('id', 'amtsAll').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeaturesAll').append($(`<span><li style='margin-top:5px'>Knob max-min (avg): <a href='#amts' data-toggle='collapse' id='amtsCollapseBtnAll' class='collapseBtnAll'>[+]</a></li></span>`).append(amtsList)
                    .on('hide.bs.collapse', () => {$('#amtsCollapseBtnAll').html('[+]')})
                    .on('show.bs.collapse', () => {$('#amtsCollapseBtnAll').html('[−]')}))
                let amtsTotalList = $('<ul></ul>').attr('id', 'amtsTotalAll').addClass('collapse').css({'font-size':'18px'})
                $('#basicFeaturesAll').append($(`<span><li style='margin-top:5px'>Knob max-min (total): <a href='#amtsTotal' data-toggle='collapse' id='amtsTotalCollapseBtnAll' class='collapseBtnAll'>[+]</a></li></span>`).append(amtsTotalList)
                    .on('hide.bs.collapse', () => {$('#amtsTotalCollapseBtnAll').html('[+]')})
                    .on('show.bs.collapse', () => {$('#amtsTotalCollapseBtnAll').html('[−]')}))
                console.log(dataObj)
                if (dataObj.times !== null) {
                    for (let i = 0; i < dataObj.sessions.length; i++) {

                    }
                    // Basic features stuff
                    let levelStartTime, levelEndTime, lastSlider = null, startIndices = [], endIndices = [], moveTypeChangesPerLevel = [], knobStdDevs = [], knobNumStdDevs = [], knobAmts = []
                    numFails = new Array($('#levelSelectAll option').size()).fill(0)
                    numMovesPerChallenge = new Array($('#levelSelectAll option').size())
                    moveTypeChangesPerLevel = new Array($('#levelSelectAll option').size()).fill(0)
                    knobStdDevs = new Array($('#levelSelectAll option').size()).fill(0)
                    knobNumStdDevs = new Array($('#levelSelectAll option').size()).fill(0)
                    knobAmts = new Array($('#levelSelectAll option').size()).fill(0)
                    startIndices = new Array($('#levelSelectAll option').size()).fill(undefined)
                    endIndices = new Array($('#levelSelectAll option').size()).fill(undefined)
                    let indicesToSplice = new Array($('#levelSelectAll option').size())
                    for (let i = 0; i < numMovesPerChallenge.length; i++) {
                        numMovesPerChallenge[i] = []
                        indicesToSplice[i] = []
                    }
                    for (let i = 0; i < dataObj.times.length; i++) {
                        if (!(endIndices[dataObj.levels[i]])) {
                            let dataJson = JSON.parse(dataObj.data[i])
                            if (dataJson !== null) {
                                if (dataJson.event_custom !== 'SLIDER_MOVE_RELEASE' && dataJson.event_custom !== 'ARROW_MOVE_RELEASE') {
                                    indicesToSplice[dataObj.levels[i]].push(i)
                                }
                            }
                            if (dataObj.events[i] === 'BEGIN') {
                                if (startIndices[dataObj.levels[i]] === undefined) { // check this space isn't filled by a previous attempt on the same level
                                    startIndices[dataObj.levels[i]] = i
                                }
                            } else if (dataObj.events[i] === 'COMPLETE') {
                                if (endIndices[dataObj.levels[i]] === undefined) {
                                    endIndices[dataObj.levels[i]] = i
                                }
                            } else if (dataObj.events[i] === 'FAIL') {
                                numFails[dataObj.levels[i]]++
                            } else if (dataObj.events[i] === 'CUSTOM' && (dataJson.event_custom === 'SLIDER_MOVE_RELEASE' || dataJson.event_custom === 'ARROW_MOVE_RELEASE')) {
                                if (lastSlider !== dataJson.slider) {
                                    moveTypeChangesPerLevel[dataObj.levels[i]]++
                                }
                                lastSlider = dataJson.slider
                                numMovesPerChallenge[dataObj.levels[i]].push(i)
                                if (dataJson.event_custom === 'SLIDER_MOVE_RELEASE') { // arrows don't have std devs
                                    knobNumStdDevs[dataObj.levels[i]]++
                                    knobStdDevs[dataObj.levels[i]] += dataJson.stdev_val
                                    knobAmts[dataObj.levels[i]] += (dataJson.max_val-dataJson.min_val)
                                }
                            }
                        }
                    }
                    for (let i in indicesToSplice) {
                        for (let j in indicesToSplice[i]) {
                            numMovesPerChallenge[i].splice(j, 1, undefined)
                        }
                    }
                    for (let i in numMovesPerChallenge) {
                        for (let j in numMovesPerChallenge[i].length) {
                            if (numMovesPerChallenge[i, j] === undefined) {
                                numMovesPerChallenge[i].splice(j, 1)
                            }
                        }
                    }

                    for (let i in Object.keys(startIndices)) {
                        if (startIndices[i] !== undefined) {
                            let levelTime = "-";
                            if (dataObj.times[endIndices[i]] && dataObj.times[startIndices[i]]) {
                                levelStartTime = new Date(dataObj.times[startIndices[i]].replace(/-/g, "/"))
                                levelEndTime = new Date(dataObj.times[endIndices[i]].replace(/-/g, "/"))
                                levelTime = (levelEndTime.getTime() - levelStartTime.getTime()) / 1000
                                totalTime += levelTime
                            }

                            totalMoves += numMovesPerChallenge[i].length
                            moveTypeChangesTotal += moveTypeChangesPerLevel[i]
                            if (knobNumStdDevs[i] !== 0) {
                                knobAmtsTotal += (knobAmts[i]/knobNumStdDevs[i])
                            }
                            
                            knobSumTotal += knobAmts[i]
    
                            // append times
                            $('#timesAll').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${levelTime} sec</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append fails
                            $('#failsAll').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${numFails[i]}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append moves
                            $('#movesAll').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${numMovesPerChallenge[i].length}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                            
                            // append types
                            $('#typesAll').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${moveTypeChangesPerLevel[i]}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append std devs
                            let knobAvgStdDev
                            if (knobNumStdDevs[i] === 0) {
                                knobAvgStdDev = 0
                            } else {
                                knobAvgStdDev = (knobStdDevs[i]/knobNumStdDevs[i])
                            }
                            $('#stdDevsAll').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${knobAvgStdDev.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append knob amounts
                            let knobAvgAmt
                            if (knobNumStdDevs[i] === 0) {
                                knobAvgAmt = 0
                            } else {
                                knobAvgAmt = (knobAmts[i]/knobNumStdDevs[i])
                            }
                            $('#amtsAll').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${knobAvgAmt.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
    
                            // append knob total amounts
                            $('#amtsTotalAll').append($(`<li>Level ${i}: </li>`).css('font-size', '14px').append($(`<div>${(knobAmts[i]).toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                        }
                    }
                    avgTime = totalTime / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#timesAll').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#timesAll').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${totalTime} sec</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#timesAll').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${avgTime.toFixed(2)} sec</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    avgMoves = totalMoves / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#movesAll').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#movesAll').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${totalMoves}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#movesAll').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${avgMoves.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    moveTypeChangesAvg = moveTypeChangesTotal / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#typesAll').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#typesAll').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${moveTypeChangesTotal}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#typesAll').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${moveTypeChangesAvg.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    knobAmtsAvg = knobAmtsTotal / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#amtsAll').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#amtsAll').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${knobAmtsTotal.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#amtsAll').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${knobAmtsAvg.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    knobSumAvg = knobSumTotal / startIndices.filter(function(value) { return value !== undefined }).length
                    $('#amtsTotalAll').append($('<hr>').css({'margin-bottom':'3px', 'margin-top':'3px'}))
                    $('#amtsTotalAll').append($(`<li>Total: </li>`).css('font-size', '14px').append($(`<div>${knobSumTotal.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))
                    $('#amtsTotalAll').append($(`<li>Avg: </li>`).css('font-size', '14px').append($(`<div>${knobSumAvg.toFixed(2)}</div>`).css({'font-size':'14px', 'float':'right', 'padding-right':'100px'})))

                    //drawWavesGoalsAll(dataObj, numMovesPerChallenge[$('#levelSelect').val()])
                }
            }
            off()
            hideError()
        }, 'json').error((jqXHR, textStatus, errorThrown) => {
            off()
            showError(jqXHR.responseText)
        })
    }

    function drawWavesGoals(dataObj, numMovesPerChallenge) {
        // Goals stuff
        $('#goalsDiv1').html('Goal 1: Completing the challenge')
        let distanceToGoal = []
        distanceToGoal = new Array(numMovesPerChallenge.length).fill(0)
        let moveGoodness = distanceToGoal // an array of 0s
        let moveNumbers = []
        let cumulativeDistance = 0
        let lastCloseness1
        for (let i in numMovesPerChallenge) {
            let dataJson = JSON.parse(dataObj.data[i])
            if (dataObj.events[i] === "CUSTOM" && (dataJson.event_custom === 'SLIDER_MOVE_RELEASE' || dataJson.event_custom === 'ARROW_MOVE_RELEASE')) {
                if (dataJson.event_custom === "SLIDER_MOVE_RELEASE") { // sliders have before and after closeness
                    if (dataJson.end_closeness < dataJson.begin_closeness) moveGoodness[i] = 1
                    else if (dataJson.end_closeness > dataJson.begin_closeness) moveGoodness[i] = -1

                    lastCloseness1 = dataJson.end_closeness
                } else { // arrow
                    if (!lastCloseness1) lastCloseness1 = dataJson.closeness
                    if (dataJson.closeness < lastCloseness1) moveGoodness[i] = -1
                    else if (dataJson.closeness > lastCloseness1) moveGoodness[i] = 1

                    lastCloseness1 = dataJson.closeness
                }
            }
            moveNumbers[i] = i
            cumulativeDistance += moveGoodness[i]
            distanceToGoal[i] = cumulativeDistance
        }

        let closenessTrace1 = {
            x: moveNumbers,
            y: distanceToGoal,
            line: {color: 'orange'},
            name: 'Net good moves',
            mode: 'lines+markers'
        }
        let graphData1 = [closenessTrace1]
        let layout1 = {
            margin: { t: 35 },
            title: `Level ${$('#levelSelect').val()}`,
            height: 200,
            xaxis: {
                title: 'Move number',
                titlefont: {
                  family: 'Courier New, monospace',
                  size: 12,
                  color: '#7f7f7f'
                }
              },
              yaxis: {
                title: 'Net good moves',
                titlefont: {
                  family: 'Courier New, monospace',
                  size: 12,
                  color: '#7f7f7f'
                }
              }
        }
        Plotly.newPlot(goalsGraph1, graphData1, layout1)


        $('#goalsDiv2').html('Goal 2: Maxing slider values')
        $('#goalsDiv2').css('display', 'block')
        $('#goalsGraph2').css('display', 'block')
        distanceToGoal = new Array(numMovesPerChallenge.length).fill(0)
        moveGoodness = new Array(numMovesPerChallenge.length).fill(0) // an array of 0s
        moveNumbers = []
        cumulativeDistance = 0;
        indicesToSplice = []
        let graph_min_x = -50
        let graph_max_x =  50
        let graph_min_y = -50
        let graph_max_y =  50
        let graph_min_offset = graph_min_x
        let graph_max_offset = graph_max_x
        let graph_min_wavelength = 2
        let graph_max_wavelength = graph_max_x*2
        let graph_min_amplitude = 0
        let graph_max_amplitude = graph_max_y*(3/5)
        let graph_default_offset = (graph_min_x+graph_max_x)/2
        let graph_default_wavelength = (2+(graph_max_x*2))/2
        let graph_default_amplitude = graph_max_y/4
        let lastCloseness = [], thisCloseness = []
        lastCloseness['OFFSET', 'left'] = lastCloseness['OFFSET', 'right'] = graph_max_offset-graph_default_offset
        lastCloseness['AMPLITUDE', 'left'] = lastCloseness['AMPLITUDE', 'right'] = graph_max_amplitude-graph_default_amplitude
        lastCloseness['WAVELENGTH', 'left'] = lastCloseness['WAVELENGTH', 'right'] = graph_max_wavelength-graph_default_wavelength
        for (let i in numMovesPerChallenge) {
            let dataJson = JSON.parse(dataObj.data[i])
            if (dataObj.events[i] === 'CUSTOM' && (dataJson.event_custom === 'SLIDER_MOVE_RELEASE' || dataJson.event_custom === 'ARROW_MOVE_RELEASE')) {
                if (dataJson.slider ===  'AMPLITUDE') {
                    thisCloseness[dataJson.slider, dataJson.wave] = graph_max_amplitude-dataJson.end_val
                } else if (dataJson.slider === 'OFFSET') {
                    thisCloseness[dataJson.slider, dataJson.wave] = graph_max_offset-dataJson.end_val
                } else if (dataJson.slider === 'WAVELENGTH') {
                    thisCloseness[dataJson.slider, dataJson.wave] = graph_max_wavelength-dataJson.end_val
                }

                if (dataJson.event_custom === 'SLIDER_MOVE_RELEASE') { // sliders have before and after closeness
                    if (thisCloseness[dataJson.slider, dataJson.wave] < lastCloseness[dataJson.slider, dataJson.wave]) moveGoodness[i] = 1
                    else if (thisCloseness[dataJson.slider, dataJson.wave] > lastCloseness[dataJson.slider, dataJson.wave]) moveGoodness[i] = -1

                    lastCloseness[dataJson.slider] = thisCloseness[dataJson.slider]
                } else { // arrow
                    if (thisCloseness[dataJson.slider, dataJson.wave] < lastCloseness[dataJson.slider, dataJson.wave]) moveGoodness[i] = -1
                    else if (thisCloseness[dataJson.slider, dataJson.wave] > lastCloseness[dataJson.slider, dataJson.wave]) moveGoodness[i] = 1

                    lastCloseness[dataJson.slider, dataJson.wave] = thisCloseness[dataJson.slider, dataJson.wave]
                }
            }
            moveNumbers[i] = i
            cumulativeDistance += moveGoodness[i]
            distanceToGoal[i] = cumulativeDistance
        }

        let closenessTrace2 = {
            x: moveNumbers,
            y: distanceToGoal,
            line: {color: 'orange'},
            name: 'Net good moves',
            mode: 'lines+markers'
        }
        let graphData2 = [closenessTrace2]
        let layout2 = {
            margin: { t: 35 },
            title: `Level ${$('#levelSelect').val()}`,
            height: 200,
            xaxis: {
                title: 'Move number',
                titlefont: {
                  family: 'Courier New, monospace',
                  size: 12,
                  color: '#7f7f7f'
                }
              },
            yaxis: {
                title: 'Net good moves',
                titlefont: {
                    family: 'Courier New, monospace',
                    size: 12,
                    color: '#7f7f7f'
                }
            }
        }
        Plotly.newPlot(goalsGraph2, graphData2, layout2)
    }
    function drawWavesGoalsAll(dataObj, numMovesPerChallenge) {
        // Goals stuff
        $('#goalsDiv1').html('Goal 1: Completing the challenge')
        let distanceToGoal = []
        distanceToGoal = new Array(numMovesPerChallenge.length).fill(0)
        let moveGoodness = distanceToGoal // an array of 0s
        let moveNumbers = []
        let cumulativeDistance = 0
        let lastCloseness1
        for (let i in numMovesPerChallenge) {
            let dataJson = JSON.parse(dataObj.data[i])
            if (dataObj.events[i] === "CUSTOM" && (dataJson.event_custom === 'SLIDER_MOVE_RELEASE' || dataJson.event_custom === 'ARROW_MOVE_RELEASE')) {
                if (dataJson.event_custom === "SLIDER_MOVE_RELEASE") { // sliders have before and after closeness
                    if (dataJson.end_closeness < dataJson.begin_closeness) moveGoodness[i] = 1
                    else if (dataJson.end_closeness > dataJson.begin_closeness) moveGoodness[i] = -1

                    lastCloseness1 = dataJson.end_closeness
                } else { // arrow
                    if (!lastCloseness1) lastCloseness1 = dataJson.closeness
                    if (dataJson.closeness < lastCloseness1) moveGoodness[i] = -1
                    else if (dataJson.closeness > lastCloseness1) moveGoodness[i] = 1

                    lastCloseness1 = dataJson.closeness
                }
            }
            moveNumbers[i] = i
            cumulativeDistance += moveGoodness[i]
            distanceToGoal[i] = cumulativeDistance
        }

        let closenessTrace1 = {
            x: moveNumbers,
            y: distanceToGoal,
            line: {color: 'orange'},
            name: 'Net good moves',
            mode: 'lines+markers'
        }
        let graphData1 = [closenessTrace1]
        let layout1 = {
            margin: { t: 35 },
            title: `Level ${$('#levelSelect').val()}`,
            height: 200,
            xaxis: {
                title: 'Move number',
                titlefont: {
                  family: 'Courier New, monospace',
                  size: 12,
                  color: '#7f7f7f'
                }
              },
              yaxis: {
                title: 'Net good moves',
                titlefont: {
                  family: 'Courier New, monospace',
                  size: 12,
                  color: '#7f7f7f'
                }
              }
        }
        Plotly.newPlot(goalsGraph1, graphData1, layout1)


        $('#goalsDiv2').html('Goal 2: Maxing slider values')
        $('#goalsDiv2').css('display', 'block')
        $('#goalsGraph2').css('display', 'block')
        distanceToGoal = new Array(numMovesPerChallenge.length).fill(0)
        moveGoodness = new Array(numMovesPerChallenge.length).fill(0) // an array of 0s
        moveNumbers = []
        cumulativeDistance = 0;
        indicesToSplice = []
        let graph_min_x = -50
        let graph_max_x =  50
        let graph_min_y = -50
        let graph_max_y =  50
        let graph_min_offset = graph_min_x
        let graph_max_offset = graph_max_x
        let graph_min_wavelength = 2
        let graph_max_wavelength = graph_max_x*2
        let graph_min_amplitude = 0
        let graph_max_amplitude = graph_max_y*(3/5)
        let graph_default_offset = (graph_min_x+graph_max_x)/2
        let graph_default_wavelength = (2+(graph_max_x*2))/2
        let graph_default_amplitude = graph_max_y/4
        let lastCloseness = [], thisCloseness = []
        lastCloseness['OFFSET', 'left'] = lastCloseness['OFFSET', 'right'] = graph_max_offset-graph_default_offset
        lastCloseness['AMPLITUDE', 'left'] = lastCloseness['AMPLITUDE', 'right'] = graph_max_amplitude-graph_default_amplitude
        lastCloseness['WAVELENGTH', 'left'] = lastCloseness['WAVELENGTH', 'right'] = graph_max_wavelength-graph_default_wavelength
        for (let i in numMovesPerChallenge) {
            let dataJson = JSON.parse(dataObj.data[i])
            if (dataObj.events[i] === 'CUSTOM' && (dataJson.event_custom === 'SLIDER_MOVE_RELEASE' || dataJson.event_custom === 'ARROW_MOVE_RELEASE')) {
                if (dataJson.slider ===  'AMPLITUDE') {
                    thisCloseness[dataJson.slider, dataJson.wave] = graph_max_amplitude-dataJson.end_val
                } else if (dataJson.slider === 'OFFSET') {
                    thisCloseness[dataJson.slider, dataJson.wave] = graph_max_offset-dataJson.end_val
                } else if (dataJson.slider === 'WAVELENGTH') {
                    thisCloseness[dataJson.slider, dataJson.wave] = graph_max_wavelength-dataJson.end_val
                }

                if (dataJson.event_custom === 'SLIDER_MOVE_RELEASE') { // sliders have before and after closeness
                    if (thisCloseness[dataJson.slider, dataJson.wave] < lastCloseness[dataJson.slider, dataJson.wave]) moveGoodness[i] = 1
                    else if (thisCloseness[dataJson.slider, dataJson.wave] > lastCloseness[dataJson.slider, dataJson.wave]) moveGoodness[i] = -1

                    lastCloseness[dataJson.slider] = thisCloseness[dataJson.slider]
                } else { // arrow
                    if (thisCloseness[dataJson.slider, dataJson.wave] < lastCloseness[dataJson.slider, dataJson.wave]) moveGoodness[i] = -1
                    else if (thisCloseness[dataJson.slider, dataJson.wave] > lastCloseness[dataJson.slider, dataJson.wave]) moveGoodness[i] = 1

                    lastCloseness[dataJson.slider, dataJson.wave] = thisCloseness[dataJson.slider, dataJson.wave]
                }
            }
            moveNumbers[i] = i
            cumulativeDistance += moveGoodness[i]
            distanceToGoal[i] = cumulativeDistance
        }

        let closenessTrace2 = {
            x: moveNumbers,
            y: distanceToGoal,
            line: {color: 'orange'},
            name: 'Net good moves',
            mode: 'lines+markers'
        }
        let graphData2 = [closenessTrace2]
        let layout2 = {
            margin: { t: 35 },
            title: `Level ${$('#levelSelect').val()}`,
            height: 200,
            xaxis: {
                title: 'Move number',
                titlefont: {
                  family: 'Courier New, monospace',
                  size: 12,
                  color: '#7f7f7f'
                }
              },
            yaxis: {
                title: 'Net good moves',
                titlefont: {
                    family: 'Courier New, monospace',
                    size: 12,
                    color: '#7f7f7f'
                }
            }
        }
        Plotly.newPlot(goalsGraph2, graphData2, layout2)
    }

    function drawWavesChart(inData) {
        let xAmpLeft = [], xAmpRight = []
        let xFreqLeft = [], xFreqRight = []
        let xOffLeft = [], xOffRight = []
        let yAmpLeft = [], yAmpRight = []
        let yFreqLeft = [], yFreqRight = []
        let yOffLeft = [], yOffRight = []
        let hasLeftData = false, hasRightData = false
        if (inData.data !== null) {
            for (let i = 0; i < inData.data.length; i++) {
                let jsonData = JSON.parse(inData.data[i])
                if (jsonData.wave === 'left') {
                    hasLeftData = true
                    if (jsonData.slider === 'AMPLITUDE') {
                        xAmpLeft.push(inData.times[i])
                        yAmpLeft.push(jsonData.end_val)
                    } else if (jsonData.slider === 'WAVELENGTH') { 
                        xFreqLeft.push(inData.times[i])
                        yFreqLeft.push(jsonData.end_val)
                    } else if (jsonData.slider === 'OFFSET') {
                        xOffLeft.push(inData.times[i])
                        yOffLeft.push(jsonData.end_val)
                    }
                } else if (jsonData.wave === 'right') {
                    hasRightData = true
                    if (jsonData.slider === 'AMPLITUDE') {
                        xAmpRight.push(inData.times[i])
                        yAmpRight.push(jsonData.end_val)
                    } else if (jsonData.slider === 'WAVELENGTH') { 
                        xFreqRight.push(inData.times[i])
                        yFreqRight.push(jsonData.end_val)
                    } else if (jsonData.slider === 'OFFSET') {
                        xOffRight.push(inData.times[i])
                        yOffRight.push(jsonData.end_val)
                    }
                }
            }
            if (hasLeftData) {
                hideNoDataLeft()
                hideNoDataGoals()
            } else {
                showNoDataLeft()
            }
            if (hasRightData) {
                hideNoDataGoals()
                hideNoDataRight()
            } else {
                showNoDataRight()
            }
        } else {
            showNoDataLeft()
            showNoDataRight()
            showNoDataGoals()
        }

        let ampTraceLeft = {
            x: xAmpLeft,
            y: yAmpLeft,
            line: {color: 'red'},
            name: 'Amplitude',
            mode: 'lines+markers'
        }
        let freqTraceLeft = {
            x: xFreqLeft,
            y: yFreqLeft,
            line: {color: 'blue'},
            name: 'Frequency',
            mode: 'lines+markers'
        }
        let offTraceLeft = {
            x: xOffLeft,
            y: yOffLeft,
            line: {color: 'green'},
            name: 'Offset',
            mode: 'lines+markers'
        }

        let ampTraceRight = {
            x: xAmpRight,
            y: yAmpRight,
            line: {color: 'red'},
            name: 'Amplitude',
            mode: 'lines+markers'
        }
        let freqTraceRight = {
            x: xFreqRight,
            y: yFreqRight,
            line: {color: 'blue'},
            name: 'Frequency',
            mode: 'lines+markers'
        }
        let offTraceRight = {
            x: xOffRight,
            y: yOffRight,
            line: {color: 'green'},
            name: 'Offset',
            mode: 'lines+markers'
        }
        let wavesDataLeft = [ampTraceLeft, freqTraceLeft, offTraceLeft]
        let wavesDataRight = [ampTraceRight, freqTraceRight, offTraceRight]
        let layoutLeft = {
            margin: { t: 35 },
            title: 'Left Sliders',
            showlegend: true
        }
        let layoutRight = {
            margin: { t: 35 },
            title: 'Right Sliders',
            showlegend: true
        }
        Plotly.newPlot(graphLeft, wavesDataLeft, layoutLeft)
        Plotly.newPlot(graphRight, wavesDataRight, layoutRight)
    }

    function drawWavesChartAll(inData) {

    }
    
    function on() {
        $('#loadingOverlay').css('display', 'block')
    }
    
    function off() {
        $('#loadingOverlay').css('display', 'none')
    }

    function showError(error) {
        $('#errorMessage').css('visibility', 'visible')
        //console.log(error)
    }

    function hideError() {
        $('#errorMessage').css('visibility', 'hidden')
    }

    function showNoDataLeft() {
        $('#noDataOverlayLeft').css('display', 'block')
        $('#noDataOverlayGoals').css('display', 'block')
    }

    function hideNoDataLeft() {
        $('#noDataOverlayLeft').css('display', 'none')
        $('#noDataOverlayGoals').css('display', 'none')
    }

    function showNoDataRight() {
        $('#noDataOverlayRight').css('display', 'block')
    }

    function hideNoDataRight() {
        $('#noDataOverlayRight').css('display', 'none')
    }

    function showNoDataGoals() {
        $('#noDataOverlayGoals1').css('display', 'block')
        $('#noDataOverlayGoals2').css('display', 'block')
        let layout = {
            margin: { t: 35 },
            title: `Level ${$('#levelSelect').val()}`,
            height: 200,
            xaxis: {
                title: 'Move number',
                titlefont: {
                    family: 'Courier New, monospace',
                    size: 12,
                    color: '#7f7f7f'
                }
                },
            yaxis: {
                title: 'Net good moves',
                titlefont: {
                    family: 'Courier New, monospace',
                    size: 12,
                    color: '#7f7f7f'
                }
            }
        }
        Plotly.newPlot(goalsGraph1, [], layout)
        Plotly.newPlot(goalsGraph2, [], layout)
    }

    function hideNoDataGoals() {
        $('#noDataOverlayGoals1').css('display', 'none')
        $('#noDataOverlayGoals2').css('display', 'none')
    }
})