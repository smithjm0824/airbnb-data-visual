import React from 'react';
import { Typography, Grid, Switch, FormGroup, FormControlLabel} from '@material-ui/core';
import DeckGL from '@deck.gl/react';
import * as d3 from "d3";
import {json as requestJson, csv as requestCsv} from 'd3-request';
import {GeoJsonLayer} from '@deck.gl/layers';
import {StaticMap} from 'react-map-gl';
import { makeStyles } from '@material-ui/core/styles';
import AustinData from '../data/austin_airbnb.geojson';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY3NlNjI0MiIsImEiOiJjazIyN3dodWQxcjhqM2ltbGNrY2Z3NzVtIn0.TYBkWk-HsUdkHkVkYyXE9A';
const colors =[[230, 25, 75], [60, 180, 75], [255, 225, 25], [0, 130, 200], [245, 130, 48], [145, 30, 180], 
[70, 240, 240], [240, 50, 230], [210, 245, 60], [250, 190, 190], [0, 128, 128], [230, 190, 255], [170, 110, 40], 
[255, 250, 200], [128, 0, 0], [170, 255, 195], [128, 128, 0], [255, 215, 180], [0, 0, 128], [128, 128, 128], [255, 255, 255], [0, 0, 0],
[230, 25, 75], [60, 180, 75], [255, 225, 25], [0, 130, 200], [245, 130, 48], [145, 30, 180], 
[70, 240, 240], [240, 50, 230], [210, 245, 60], [250, 190, 190], [0, 128, 128], [230, 190, 255], [170, 110, 40], 
[255, 250, 200], [128, 0, 0], [170, 255, 195], [128, 128, 0], [255, 215, 180], [0, 0, 128], [128, 128, 128], [255, 255, 255], [0, 0, 0],
[230, 25, 75], [60, 180, 75], [255, 225, 25], [0, 130, 200]];

const neighbourhoods = ["78739", "78754", "78732", "78737", "78756", "78747", "78751", "78712", "78738", "78725", "78757", "78728", "78744", 
    "78736", "78702", "78741", "78719", "78742", "78722", "78703", "78717", "78749", "78730", "78745", "78731", "78748", "78729", "78752", 
    "78724", "78704", "78753", "78705", "78758", "78746", "78759", "78726", "78733", "78723", "78750", "78735", "78721", "78727", "78734", "78701"];

const color_scale = d3.scaleOrdinal().domain(neighbourhoods).range(colors);

const useStyles = makeStyles(theme => ({
    toolbar : {
        height : "100%"
    },
    mapbox : {
        height : "100%"
    }
}));

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
            elevationByCount : false
        }
    };

    componentDidMount() {
        requestJson(AustinData, (error, response) => {
            if (!error) {
              this.loadGeo(response);
            }    
        });
    }

    loadGeo = response => {
        this.setState({austinData : response});
        let neighbourhoods = [];
        for (let i = 0; i < response.features.length; i++) {
            neighbourhoods.push(response.features[i].properties.neighbourhood);
        }
        console.log(neighbourhoods);
    }
    
    renderLayers() {
        const {austinData, elevationByCount} = this.state;
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
            getElevation: d => {return elevationByCount ? parseInt(d.properties.count) : parseInt(d.properties.avg_price)},
            updateTriggers: {getElevation: this.state.elevationByCount}
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
                            <Grid component="label" container justify="center" spacing={1}>
                                <Grid item>Average Price</Grid>
                                <Grid item>
                                    <Switch size="small" checked={this.state.elevationByCount} 
                                        onChange={d => {this.setState((state) => ({elevationByCount : !this.state.elevationByCount}))}} />
                                </Grid>
                                <Grid item>Number of Listings</Grid>
                            </Grid>
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
