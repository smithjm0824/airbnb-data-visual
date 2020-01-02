import React from 'react';
import { Typography, Grid, Switch } from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import {  MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import DeckGL from '@deck.gl/react';
import * as d3 from "d3";
import {json as requestJson, csv as requestCsv} from 'd3-request';
import {GeoJsonLayer} from '@deck.gl/layers';
import {StaticMap} from 'react-map-gl';
import { makeStyles } from '@material-ui/core/styles';
import AustinData from '../data/austin_airbnb.geojson';
import AvailabilityData from '../data/austin_availability_by_neighborhood.csv';
import {neighbourhoods, dates, colors} from '../data/austin_arrays';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY3NlNjI0MiIsImEiOiJjazIyN3dodWQxcjhqM2ltbGNrY2Z3NzVtIn0.TYBkWk-HsUdkHkVkYyXE9A';

const color_scale = d3.scaleOrdinal().domain(neighbourhoods).range(colors);

const useStyles = makeStyles(theme => ({
    toolbar : {
        height : "100%"
    },
    mapbox : {
        height : "100%"
    }
}));

let handleSimulation;

const viewState = {
    width: window.innerWidth,
    height: window.innerHeight,
    longitude: -97.7431,
    latitude: 30.2672,
    zoom: 9,
    pitch: 0,
    bearing: 0
};

class Content extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            austinData : null,
            availability : null,
            selectedTime : 0,
            simulate: false,
            filter: false,
            elevationByCount : false
        }
    };

    componentDidMount() {
        requestJson(AustinData, (error, response) => {
            if (!error) {
              this.loadGeo(response);
            }    
        });

        requestCsv(AvailabilityData, (error, response) => {
            if (!error) {
                this.loadAvailability(response);            }
        })
    }

    loadGeo = response => {
        this.setState({austinData : response});
    }

    loadAvailability = response => {
        this.setState({availability : response});
    }
    
    simulateTime() {
        const {availability} = this.state;
        const self = this;
        let i = this.state.selectedTime;
        handleSimulation = setInterval(function () {     
            if (i == availability.length) {          	  
                i = 0;
            }
            self.setState({selectedTime : i}, () => {
                i++;
            })
         }, 1500);

    }

    filterData(data) {
        let filteredData;
        const {selectedTime} = this.state;
        if (data !== null) {
            filteredData = data.filter(function(row) {
                return row.date == dates[selectedTime];
            })

            // count is the combined count of available listings across all neighborhoods for the selected date
            let count = 0;
            filteredData.forEach(function(d) {
                count += parseInt(d.count);
            });

            // represents the total count of available listings for the selected date
            return filteredData;
        }
    }

    formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
    
        return [year, month, day].join('-');
    }

    handleTimeChange = date => {
        clearInterval(handleSimulation);
        console.log(this.state.selectedTime);
        this.setState((state) => ({filter : true, selectedTime : dates.indexOf(this.formatDate(date))}),
            () => {
                if (this.state.simulate) {
                this.simulateTime();
                }
            }   
        );
    }

    renderLayers() {
        const {austinData, availability, elevationByCount, simulate, filter} = this.state;
        let filteredData = filter ? this.filterData(availability) : null;

        return [ 
            new GeoJsonLayer({
            id: 'geojson-layer',
            data : austinData,
            pickable: true,
            stroked: false,
            filled: true,
            opacity: 0.5,
            extruded: true,
            lineWidthScale: 20,
            lineWidthMinPixels: 2,
            getFillColor: d => {
                return color_scale(parseInt(d.properties.neighbourhood));
            },
            getRadius: 100,
            getLineWidth: 1,
            getElevation: d => {
                if (this.state.elevationByCount) {
                    let tempData = {};
                    if (filter) {
                        tempData = filteredData.filter(
                            function(row) {
                                return row.neighbourhood == d.properties.neighbourhood;
                            }
                        )[0];
                        if (tempData) {
                            return parseInt(tempData.count) * 10;
                        }
                    } else {
                        return parseInt(d.properties.count);
                    }
                } else {
                    let tempData = {};
                    if (filter) {
                        tempData = filteredData.filter(
                            function(row) {
                                return row.neighbourhood == d.properties.neighbourhood;
                            }
                        )[0];
                        if (tempData) {
                            return parseInt(tempData.avg_price) * 10;
                        }
                    } else {
                        return parseInt(d.properties.avg_price) * 5;
                    }
                }
            },
            updateTriggers: {
                getElevation: [this.state.elevationByCount, this.state.selectedTime]
            }
            // onHover: ({object, x, y}) => {
            //     const tooltip = object.properties.name || object.properties.station;
            //     /* Update tooltip
            //         http://deck.gl/#/documentation/developer-guide/adding-interactivity?section=example-display-a-tooltip-for-hovered-object
            //     */
            //     }
            })
        ]
    };
    
    render () {
        const classes = useStyles;
        return (
            <div style={{height :  "100%"}}>
                <Grid container style={{height :  "100%"}}>
                    <Grid style={{height :  "100%"}} item xs={3}>
                        <Typography component="div">
                            <Grid style={{height :  "100%"}} component="label" container justify="center" spacing={1}>
                                <Grid item>Average Price</Grid>
                                <Grid item>
                                    <Switch size="small" checked={this.state.elevationByCount} 
                                        onChange={d => {this.setState((state) => ({elevationByCount : !this.state.elevationByCount}))}} />
                                </Grid>
                                <Grid item>Number of Listings</Grid>
                            </Grid>
                            <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                <Grid container justify="space-around">
                                    <KeyboardDatePicker
                                        disableToolbar
                                        variant="inline"
                                        format="MM/dd/yyyy"
                                        minDate = "09/19/2019"
                                        maxDate = "09/17/2020"
                                        margin="normal"
                                        id="date-picker-inline"
                                        label="Date picker inline"
                                        onChange={this.handleTimeChange}
                                        value={new Date((dates[this.state.selectedTime]) + " 12:00:00")}
                                        KeyboardButtonProps={{
                                            'aria-label': 'change date',
                                        }}
                                    />
                                </Grid>
                            </MuiPickersUtilsProvider>
                        </Typography>
                    </Grid>
                    <Grid style={{height :  "100%"}} item xs={9}>
                        <div style={{position: "relative", height: window.innerHeight - 190 + 15, width:  window.innerWidth - 400}}>
                            <DeckGL 
                            initialViewState={viewState}
                            layers={this.renderLayers()}
                            controller={true}>
                                <StaticMap 
                                    preventStyleDiffing={true}
                                    mapboxApiAccessToken={MAPBOX_TOKEN} />
                            </DeckGL>
                        </div>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

export default Content;
