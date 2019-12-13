import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import './styles/Header.css';
import { Typography } from '@material-ui/core';

function Header() {
  return (
    <AppBar position="static" style={{alignItems : "center"}}>
      <Toolbar>
        <Typography variant="h5">
          Visualizing Austin's AirBnB Listings
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
