
// @flow

import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders'
import { getBatteryLevel, sportableColors } from '../../const'
import { AreasOfAccess } from './areas_of_access';
import { PositionMap } from './position_map';
import { speed, movingAverage, distance, getColor } from '../../utils/helpers';
import { encodeHardwareId } from '../../utils/encoding';
import animations from './animations'
import _ from 'lodash'
import { defaultPitch } from './pitch'
import { PitchBuilder } from './3D/pitch'

// Import canvas tools
import { drawLine } from './canvas/drawing'
import { drawPointTarget } from './canvas/targets'

// Import images
import playerAvatar from '../img/player_profile_avatar.svg'
import dummyImg from '../img/pic1.jpg'
import fieldLengthImg from '../img/field_length3.png'
import fieldTileImg from '../img/field_tile.jpg'
import netballTileImg from '../img/netball-tile.png'
import netballTileImg2 from '../img/netball-tile-2.jpg'
import fieldWidthImg from '../img/field_width3.png'
import flareBlueImg from '../img/flare-blue.png'
import l1Img from '../img/l1.jpg'
import l2Img from '../img/l2.jpg'
import l3Img from '../img/l3.jpg'
import l4Img from '../img/l5.jpg'
import l5Img from '../img/l5.jpg'
import l6Img from '../img/l6.jpg'
import l7Img from '../img/l7.jpg'
import l8Img from '../img/l8.jpg'
import netballL1Img from '../img/netball-l1.jpg'
import netballL2Img from '../img/netball-l2.jpg'
import netballL3Img from '../img/netball-l3.jpg'
import footballPitchImg from '../img/pitch.png'
import nflTxImg from '../img/nfl-texture.png'
import sideboardImg from '../img/sideboard.jpg'
import blackRec from '../img/blackrec.jpg'
import rugbyXLogoRight from '../img/rugby-x-logo-right.svg'
import rugbyXLogoLeft from '../img/rugby-x-logo-left.svg'
import nflLogo from '../img/nfl-league-logo.png'
import pitchBackground from '../img/pitch-background.png'
import pitchTexture from '../img/pitch-texture.png'
import sportableLogoWhiteLeft from '../img/sportable-logo-white-left.svg'
import sportableLogoWhiteRight from '../img/sportable-logo-white-right.svg'

import anchorImg from '../img/anchor.png'
import personImgSrc from '../img/person-icon.svg'
import leftArrow from '../img/left-pitch-arrow.svg'
import rightArrow from '../img/right-pitch-arrow.svg'

import rugbyBallMesh from '../scenes/Rugby_Ball/Rugby_Ball.gltf'
import '../scenes/Rugby_Ball/textures/normal.png'

// Switch for fixed z axis
let fixedZ = false;

let babylonScaleFactor = 10

export const StrackController = {

  pitchFlipped: false,
  strackTimeout: null,

  clearTimeout: () => {
    clearTimeout(StrackController.strackTimeout)
  },

  // SETUP
  Strack: function(playbackSettings = {}) {


    StrackController.pitchFlipped = false

    this.canvasReady = false

    this.teamA = 0;
    this.teamB = 0;

    this.teams = {
      A: {},
      B: {}
    }

    this.players = {}
    this.fixedZHeight = 1.2

    this.balls = {};

    this.playerStats = {
      vMag: 0,
      aMag: 0
    };

    this.ballStats = {
      vMag: 0,
      z: 0
    };

    this.buffer = {};
    this.bufferHasData = false;

    this.playerSelected = '';
    this.playerSphereDiameter = 1.0;

    this.ballSelected = '';
    this.ballSphereDiameter = 0.7;
    this.ballOutlineWidth = 0.2;

    this.scaleX = 1;
    this.scaleY = 1;
    this.scaleZ = 1;

    this.scene = null;
    this.camera = null;
    this.cameraSpeed = 0.05;
    this.cameraCurrent = [
      0, 0, 0
    ];
    this.initCameraZoom = 120

    this.engine = null;

    this.selectedBalls = [];

    this.aspect3DCanvas = 1.73;

    this.selectedPlayer = {};

    this.kickDirection = 0

    this.ealingOffset = {
      x: 0,
      y: 0
    }

    this.init = async ({
                         pitch = defaultPitch,
                         diags = false,
                         live = true,
                         sessionConfig = [],
                         team = {},
                         teamB = {},
                         anchorConfig = {},
                         anchorSetup,
                         canvasId = 'strack',
                         cover = 'rugby-cover',
                         babylonActive = true,
                         events = false,
                         tracking = false,
                         initialView = '2D'
                       }, endLoading) => {

      this.view = initialView

      if (!pitch.coordinates) {
        pitch = defaultPitch
      }

      this.tracking = tracking

      this.diags.active = diags

      this.babylonActive = babylonActive

      this.sessionTags = sessionConfig;

      this.teams = {
        A: team,
        B: teamB
      }

      if (anchorSetup) {
        this.anchorSetup = {
          ...this.anchorSetup,
          ...anchorSetup,
          anchorsOnline: Object.keys(anchorConfig).map(Number),
          active: true
        }
      }

      this.setKicksColours()
      this.anchorConfig = anchorConfig

      this.canvasId3D = `${canvasId}-3D`
      this.canvasId2D = `${canvasId}-2D`
      this.coverId = `${canvasId}-${cover}`

      this.buildPitch(pitch, canvasId, () => {

        // Load 2D map of pitch
        this.mapCanvas = document.getElementById(this.canvasId2D)
        this.mapCanvas.style.boxShadow = 'inset 0px 0px 66px rgba(0,0,0,0.5)'
        this.loadMap();

        // Load Babylon 3D render of pitch else stop loading
        if (babylonActive) {
          this.load(endLoading)
        } else {
          endLoading()
        }

        //--> Load slow loop and WebGL
        if (tracking) {
          this.loopCounter = 1
          this.loop();
        }
      })
    }

    this.end = (cb) => {
      if (this.babylonActive) {
        this.scene.dispose()
        this.engine.dispose()
      }

      if (this.tracking) {
        this.stopMapLoop()
      }

      let childNodes = this.canvasContainer2D.childNodes
      let clones = []

      for (let i = 0; i < childNodes.length; i++) {
        let node = childNodes[i]
        let clone = node.cloneNode()
        clones.push(clone)
      }

      for (let i = childNodes.length - 1; i >= 0; i--) {
        let node = childNodes[i]
        node.remove()
      }

      clones.forEach((clone) => {
        this.canvasContainer2D.append(clone)
      })

      cb()
    }

    this.buildPitch = (pitch, canvasId, callback) => {
      //--> set canvas element size
      this.canvasSection = document.getElementById(`${canvasId}-canvas-section`)
      this.canvasContainer = document.getElementById(`${canvasId}-strack-canvas-container`)
      this.canvasContainer2D = document.getElementById(`${canvasId}-2D-canvas-container`)

      this.canvasHeight = parseInt(window.getComputedStyle(this.canvasContainer).height, 10)
      this.canvasSectionWidth = parseInt(window.getComputedStyle(this.canvasSection).width, 10)

      this.canvasWidth = this.canvasHeight * this.aspect3DCanvas;

      //--> Generate pitch config
      this.pitchType = pitch.type || 0

      // Set field and pole values
      // If no lengths are given set default length
      this.field = {}
      this.poles = {}
      let { field, poles } = this

      this.dimensions = pitch.coordinates || pitch.dimensions

      let { dimensions } = this

      //--> Set total pitch / field width and distance between trylines
      field.height = dimensions.P21.y
      field.width = dimensions.P11.x - dimensions.P1.x
      field.tryLineDistance = dimensions.P10.x - dimensions.P2.x

      poles.height = dimensions.P32.z
      poles.width = dimensions.P33.y - dimensions.P31.y
      poles.crossbarHeight = dimensions.P31.z
      poles.diameter = 0.2

      for (let l = 1; l <= 10; l++) {
        field[`l${l}`] = dimensions[`P${l + 1}`].x - dimensions[`P${l}`].x
      }

      //--> Update pitch config based on pitch type
      //--> 0. Rugby
      //--> 1. Netball
      //--> 2. Rugby X

      switch(this.pitchType) {
        case 0:
          field.edges = 3
          this.poles.diameter = 0.1

          field.color = '#089b64'

          // Breakdown line gaussian map
          this.gausMap = create2DArray(Math.ceil(field.tryLineDistance), Math.ceil(field.height))
          break
        case 1:

          this.fixedZHeight = 1.3

          // Change initial camera position
          this.initCameraZoom = 40

          // Ealing pitch offset for netball sessions at ealing
          this.ealingOffset.x = 5
          this.ealingOffset.y = -5

          field.edges = 3.05
          this.poles.diameter = 0.05
          this.poles.height = 3.05
          this.poles.hoopDiameter = 0.38

          // Resize players and ball for netball
          this.ballSphereDiameter = 0.4
          this.ballOutlineWidth = 0.1

          this.playerSphereDiameter = 0.5
          field.color = '#4A90E2'
          break
        case 2:

          // Ealing pitch offset for rugby X sessions at ealing
          // this.ealingOffset.x = 19.55
          // this.ealingOffset.y = -33.1
          field.edges = 2
          field.color = '#3C3C3B'
          break
        case 3:
          field.edges = 3
          this.poles.width = 5.6
          this.poles.diameter = 0.1

          field.color = '#089b64'

          // Breakdown line gaussian map
          this.gausMap = create2DArray(Math.ceil(field.tryLineDistance), Math.ceil(field.height))
          break
        default:
          break
      }

      callback()
    }

    this.stGaugeGo = (index, val) => {
      this['gaugeTarget' + index] = Math.round(val / 100 * 45);
    };

    this.areasOfAccessActive = false;

    this.setPos = (team, tagId, x, y, z) => {
      if (team) {
        let player = this.players[tagId];
        player.mesh.position.x = x * this.scaleX;
        player.mesh.position.z = y * this.scaleY;
        player.mesh.position.y = z * this.scaleZ;
        player.plane.position.x = x * this.scaleX;
        player.plane.position.z = y * this.scaleY;
        player.plane.position.y = z * this.scaleZ + 3;
      } else {
        let ball = this.balls[tagId];
        ball.mesh.position.x = x * this.scaleX;
        ball.mesh.position.z = y * this.scaleY;
        ball.mesh.position.y = z * this.scaleZ;
      }
    };

    this.mapCanvas = null;
    this.mapCtx = null;
    this.mapObjects = {};

    this.flipPitch = () => {
      StrackController.pitchFlipped = !StrackController.pitchFlipped
      if (this.events.active) {
        this.plotEventsOnCanvas(null, true)
      }
    }

    // Convert data coordinate to scaled 2D canvas coordinate
    this.getCanvasCoordinate = (scale, x, y, overlayElement) => {
      if (!scale) scale = this.scale
      let coord = {}
      if (!StrackController.pitchFlipped || overlayElement) {
        coord.scaleX = (x + this.mapOffsetX + (this.mapWidth / 2)) * scale
        coord.scaleY = (this.mapHeight - y + this.mapOffsetY) * scale
      } else {
        coord.scaleX = (this.mapOffsetX + (this.mapWidth / 2) - x) * scale
        // Mirror pitch
        // coord.scaleY = (this.mapHeight - y + this.mapOffsetY) * scale;
        // Rotate pitch 180 deg
        coord.scaleY = (y + this.mapOffsetY) * scale
      }
      return coord
    }

    this.getPitchCoordinate = (scale, x, y) => {
      let coord = {}
      if (!StrackController.pitchFlipped) {
        coord.pitchX = x / scale - this.mapOffsetX - this.mapWidth / 2
        coord.pitchY = this.mapHeight + this.mapOffsetY - y / scale
      } else {
        coord.pitchX = this.mapOffsetX + this.mapWidth / 2 - x / scale
        // Mirror pitch
        // coord.scaleY = (this.mapHeight - y + this.mapOffsetY) * scale;
        // Rotate pitch 180 deg
        coord.pitchY = y / scale - this.mapOffsetY
      }
      return coord
    }

    this.getPitchCoordinateFromCanvasOffset = (scale, x, y) => {
      let coord = {}
      if (!StrackController.pitchFlipped) {
        coord.x = x / scale - this.mapOffsetX - this.mapWidth / 2
        coord.y = -(y / scale) + this.mapHeight + this.mapOffsetY
      } else {
        coord.x = -(x / scale) + this.mapOffsetX + this.mapWidth / 2
        coord.y = y / scale + this.mapOffsetY
      }
      return coord
    }

    //--> Drawing functions for 2D canvas

    this.drawCircle = (x, y, ctx, radius, color = 'black', fillColor = 'transparent', lineWidth = 1, callback) => {
      const center = this.getCanvasCoordinate(this.canvas2DPixelScale, x , y)
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.arc(center.scaleX, center.scaleY, radius, 0, Math.PI * 2, false);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.strokeStyle = color;
      ctx.fill();
      ctx.stroke();
      if (callback) callback()
    }

    this.drawTextBox = (text, x, y, font, color, ctx, xOffset = 0, yOffset = 0) => {

      ctx.font = font
      let coords = this.getCanvasCoordinate(this.canvas2DPixelScale, x, y)
      ctx.fillText(text, coords.scaleX + xOffset, coords.scaleY + yOffset)
    }

    this.draw2DCircle = (ctx, x, y, color, fillColor, radius, lineWidth = 2, lineDash = []) => {
      ctx.beginPath()
      ctx.lineWidth = lineWidth
      ctx.setLineDash(lineDash)
      ctx.arc(x, y, radius, 0, Math.PI * 2, false)
      ctx.closePath()
      ctx.fillStyle = fillColor
      ctx.strokeStyle = color
      ctx.fill()
      ctx.stroke()
    }

    this.drawMapCircle = (ctx, x, y, t, n, defLine, selected, color, fillColor, radius) => {

      if (!t) {
        if(selected){
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.arc(x, y, radius ? radius : 9, 0, Math.PI * 2, false);
          ctx.closePath();
          ctx.fillStyle = "#ED975E";
          ctx.strokeStyle = "#4e4e4e";
          ctx.fill();
          ctx.stroke();
        } else{
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.arc(x, y, 9, 0, Math.PI * 2, false);
          ctx.closePath();
          ctx.fillStyle = "#fdff00";
          ctx.strokeStyle = "#4e4e4e";
          ctx.fill();
          ctx.stroke();
        }
      } else {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.arc(x, y, 9, 0, Math.PI * 2, false);
        ctx.closePath();
        if (t === 'B') {
          if (defLine) {
            ctx.fillStyle = "rgba(120, 161, 255, 0.4)";
            ctx.strokeStyle = "#ED975E";
          } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.strokeStyle = color ? color : "black";
          }
        } else if (t == 'A') {
          if (defLine) {
            ctx.fillStyle = "rgba(246, 70, 69, 0.6)";
            ctx.strokeStyle = "#E3E666";
          } else {
            ctx.fillStyle = "rgba(246, 70, 69, 0.6)";
            ctx.strokeStyle = "rgba(246, 70, 69, 1)";
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.strokeStyle = color ? color : "rgba(246, 70, 69, 1)";
          }
        }
        ctx.fill();
        ctx.stroke();

        // ctx.textAlign = "center";
        // ctx.fillStyle = "#FFFFFF";
        // ctx.strokeStyle = "#FFFFFF";
        // ctx.font = "13px Verdana";
        // ctx.fillText(n, x, y + 6);
      }
    };

    this.drawArrow = (fromx, fromy, tox, toy, color) => {
      const {mapCtx} = this;

      const from = this.getCanvasCoordinate(this.canvas2DPixelScale, fromx , fromy),
        to = this.getCanvasCoordinate(this.canvas2DPixelScale, tox , toy);
      //variables to be used when creating the arrow
      let ctx = mapCtx;
      let headlen = 10;

      let angle = Math.atan2(to.scaleY-from.scaleY,to.scaleX-from.scaleX);

      //starting path of the arrow from the start square to the end square and drawing the stroke
      ctx.beginPath();
      ctx.moveTo(from.scaleX, from.scaleY);
      ctx.lineTo(to.scaleX, to.scaleY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 22;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fill();

      //starting a new path from the head of the arrow to one of the sides of the point
      ctx.beginPath();
      ctx.moveTo(to.scaleX, to.scaleY);
      ctx.lineTo(to.scaleX-headlen*Math.cos(angle-Math.PI/7),to.scaleY-headlen*Math.sin(angle-Math.PI/7));

      //path from the side point of the arrow, to the other side point
      ctx.lineTo(to.scaleX-headlen*Math.cos(angle+Math.PI/7),to.scaleY-headlen*Math.sin(angle+Math.PI/7));

      //path from the side point back to the tip of the arrow, and then again to the opposite side point
      ctx.lineTo(to.scaleX, to.scaleY);
      ctx.lineTo(to.scaleX-headlen*Math.cos(angle-Math.PI/7),to.scaleY-headlen*Math.sin(angle-Math.PI/7));

      //draws the paths created above
      ctx.strokeStyle = color;
      ctx.lineWidth = 22;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Draw rugby pitch background on 2D canvas
    this.drawRugbyLines = (color) => {
      const { mapWidth, mapHeight, coverCtx, field, poles, teams } = this

      // var backgroundImg = new Image()
      // backgroundImg.onload = () => {
      //   coverCtx.drawImage(backgroundImg, 0, 0, this.mapWidth, this.mapHeight)
      // }
      // backgroundImg.src = pitchTexture

      // Add default tryline overlay if no teams
      if (!teams.A.id) {
        let leftTryZoneScaledOrigin = this.getCanvasCoordinate(this.canvas2DPixelScale, this.dimensions.P26.x, this.dimensions.P26.y)
        let leftTryZoneLength = this.dimensions.P25.x - this.dimensions.P26.x
        coverCtx.fillStyle = 'rgba(0,0,150,0.2)'
        coverCtx.fillRect(leftTryZoneScaledOrigin.scaleX, leftTryZoneScaledOrigin.scaleY, leftTryZoneLength * this.canvas2DPixelScale, field.height * this.canvas2DPixelScale)

        let rightTryZoneScaledOrigin = this.getCanvasCoordinate(this.canvas2DPixelScale, this.dimensions.P17.x, this.dimensions.P17.y)
        let rightTryZoneLength = this.dimensions.P16.x - this.dimensions.P17.x
        coverCtx.fillStyle = 'rgba(0,0,150,0.2)'
        coverCtx.fillRect(rightTryZoneScaledOrigin.scaleX, rightTryZoneScaledOrigin.scaleY, rightTryZoneLength * this.canvas2DPixelScale, field.height * this.canvas2DPixelScale)

        let logoWidth = (field.width - field.tryLineDistance) / 2 - 3
        let logoHeight = logoWidth * 5.65

        // var leftImg = new Image()
        // leftImg.onload = () => {
        //   coverCtx.drawImage(leftImg, this.getCanvasCoordinate(this.canvas2DPixelScale, (-(mapWidth / 2) - field.l1 / 2) - logoWidth / 2).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, (mapHeight / 2) + logoHeight / 2).scaleY, logoWidth * this.canvas2DPixelScale, logoHeight * this.canvas2DPixelScale)
        // }
        // leftImg.src = sportableLogoWhiteLeft
        //
        // var rightImg = new Image()
        // rightImg.onload = () => {
        //   coverCtx.drawImage(rightImg, this.getCanvasCoordinate(this.canvas2DPixelScale, (mapWidth / 2 + field.l1 / 2) - logoWidth / 2).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, (mapHeight / 2) + logoHeight / 2).scaleY, logoWidth * this.canvas2DPixelScale, logoHeight * this.canvas2DPixelScale)
        // }
        // rightImg.src = sportableLogoWhiteRight
      }

      // Draw mown patches

      let numberOfVerticalPatches = 20
      let numberOfHorizontalPatches = numberOfVerticalPatches * 0.7

      let verticalPatchWidth = field.tryLineDistance / numberOfVerticalPatches
      let horizontalPatchWidth = field.height / numberOfHorizontalPatches

      let patchOrigin = this.dimensions.P25

      for (let i = 0; i < numberOfVerticalPatches; i++) {
        if (i % 2 === 0) {
          let scaledOrigin = this.getCanvasCoordinate(this.canvas2DPixelScale, patchOrigin.x + i * verticalPatchWidth, patchOrigin.y)
          coverCtx.fillStyle = 'rgba(0,0,0,0.1)'
          coverCtx.fillRect(scaledOrigin.scaleX, scaledOrigin.scaleY, verticalPatchWidth * this.canvas2DPixelScale, field.height * this.canvas2DPixelScale)
        }
      }

      for (let i = 0; i < numberOfHorizontalPatches; i++) {
        if (i % 2 === 0) {
          let scaledOrigin = this.getCanvasCoordinate(this.canvas2DPixelScale, patchOrigin.x, patchOrigin.y - i * horizontalPatchWidth)
          coverCtx.fillStyle = 'rgba(0,0,0,0.1)'
          coverCtx.fillRect(scaledOrigin.scaleX, scaledOrigin.scaleY, field.tryLineDistance * this.canvas2DPixelScale, horizontalPatchWidth * this.canvas2DPixelScale)
        }
      }

      const { dimensions } = this

      // Border

      coverCtx.beginPath()
      coverCtx.setLineDash([0]);
      coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, dimensions.P1.x).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, dimensions.P1.y).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, dimensions.P26.x).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, dimensions.P26.y).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, dimensions.P16.x).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, dimensions.P16.y).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, dimensions.P11.x).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, dimensions.P11.y).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, dimensions.P1.x).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, dimensions.P1.y).scaleY);
      coverCtx.lineWidth = 3;
      coverCtx.strokeStyle = color;
      coverCtx.stroke();

      // drawLine(0, 0, -(mapWidth / 2), 0, coverCtx);
      // drawLine(0, 0, mapWidth / 2, 0, coverCtx);
      // drawLine(0, mapHeight, -(mapWidth / 2), mapHeight, coverCtx);
      // drawLine(0, mapHeight, mapWidth / 2, mapHeight, coverCtx);

      // Halfway line
      drawLine(dimensions.P6.x, dimensions.P6.y, dimensions.P21.x, dimensions.P21.y, coverCtx, null, null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);

      // Trylines
      drawLine(dimensions.P2.x, dimensions.P2.y, dimensions.P25.x, dimensions.P25.y, coverCtx, null, null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
      drawLine(dimensions.P10.x, dimensions.P10.y, dimensions.P17.x, dimensions.P17.y, coverCtx, null, null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);

      // 22


      drawLine(dimensions.P4.x, dimensions.P4.y, dimensions.P23.x, dimensions.P23.y, coverCtx, null, null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
      drawLine(dimensions.P8.x, dimensions.P8.y, dimensions.P19.x, dimensions.P19.y, coverCtx, null, null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);

      // 10
      drawLine(dimensions.P5.x, dimensions.P5.y, dimensions.P22.x, dimensions.P22.y, coverCtx, [2, 2], 2, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
      drawLine(dimensions.P7.x, dimensions.P7.y, dimensions.P20.x, dimensions.P20.y, coverCtx, [2, 2], 2, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);

      const { dashSizeX, dashSizeY } = field

      drawLine(dimensions.P3.x, dimensions.P3.y, dimensions.P24.x, dimensions.P24.y, coverCtx, [0, dashSizeY / 2, dashSizeY, dashSizeY, dashSizeY, dashSizeY * 2, dashSizeY, dashSizeY, dashSizeY, dashSizeY * 2, dashSizeY, dashSizeY, dashSizeY, dashSizeY / 2, 0], 2, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
      drawLine(dimensions.P9.x, dimensions.P9.y, dimensions.P18.x, dimensions.P18.y, coverCtx, [0, dashSizeY / 2, dashSizeY, dashSizeY, dashSizeY, dashSizeY * 2, dashSizeY, dashSizeY, dashSizeY, dashSizeY * 2, dashSizeY, dashSizeY, dashSizeY, dashSizeY / 2, 0], 2, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);

      drawLine(dimensions.P27.x, dimensions.P27.y, dimensions.P15.x, dimensions.P15.y, coverCtx, [0, dashSizeX, dashSizeX, (field.l2 + field.l3) - field.l2 - dashSizeX - dashSizeX / 2, dashSizeX, mapWidth / 2 - ((field.l2 + field.l3) + field.l5) - dashSizeX, dashSizeX, dashSizeX, dashSizeX, dashSizeX, dashSizeX, mapWidth / 2 - ((field.l8 + field.l9) + field.l6) - dashSizeX, dashSizeX, (field.l8 + field.l9) - field.l9 - dashSizeX - dashSizeX / 2, dashSizeX, 0], 2, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
      drawLine(dimensions.P30.x, dimensions.P30.y, dimensions.P12.x, dimensions.P12.y, coverCtx, [0, dashSizeX, dashSizeX, field.l2 - field.l2 - dashSizeX - dashSizeX / 2, dashSizeX, mapWidth / 2 - (field.l2 + field.l4) - dashSizeX, dashSizeX, dashSizeX, dashSizeX, dashSizeX, dashSizeX, mapWidth / 2 - (field.l7 + field.l5) - dashSizeX, dashSizeX, field.l7 - field.l2 - dashSizeX - dashSizeX / 2, dashSizeX, 0], 2, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
      drawLine(dimensions.P28.x, dimensions.P28.y, dimensions.P14.x, dimensions.P14.y, coverCtx, [0, dashSizeX, dashSizeX, field.l2 - field.l2 - dashSizeX - dashSizeX / 2, dashSizeX, mapWidth / 2 - (field.l2 + field.l4) - dashSizeX, dashSizeX, dashSizeX, dashSizeX, dashSizeX, dashSizeX, mapWidth / 2 - (field.l7 + field.l5) - dashSizeX, dashSizeX, field.l7 - field.l2 - dashSizeX - dashSizeX / 2, dashSizeX, 0], 2, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
      drawLine(dimensions.P29.x, dimensions.P29.y, dimensions.P13.x, dimensions.P13.y, coverCtx, [0, dashSizeX, dashSizeX, field.l2 - field.l2 - dashSizeX - dashSizeX / 2, dashSizeX, mapWidth / 2 - (field.l2 + field.l4) - dashSizeX, dashSizeX, dashSizeX, dashSizeX, dashSizeX, dashSizeX, mapWidth / 2 - (field.l7 + field.l5) - dashSizeX, dashSizeX, field.l7 - field.l2 - dashSizeX - dashSizeX / 2, dashSizeX, 0], 2, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);

      this.drawCircle(dimensions.P31.x, dimensions.P31.y, coverCtx, 3, color, 'white')
      this.drawCircle(dimensions.P33.x, dimensions.P33.y, coverCtx, 3, color, 'white')
      this.drawCircle(dimensions.P35.x, dimensions.P35.y, coverCtx, 3, color, 'white')
      this.drawCircle(dimensions.P37.x, dimensions.P37.y, coverCtx, 3, color, 'white')
    }
    this.drawNetballLines = (color) => {
      const { mapWidth, mapHeight, coverCtx, field, poles } = this

      // draw border
      coverCtx.beginPath()
      coverCtx.setLineDash([0])
      coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 + field.l1)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY)
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 + field.l1)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY)
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2 + field.l10).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY)
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2 + field.l10).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY)
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 + field.l1)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY)
      coverCtx.lineWidth = 3
      coverCtx.strokeStyle = color
      coverCtx.stroke()

      // Draw midlines
      drawLine(-field.l5, mapHeight, -field.l5, 0, coverCtx, null, null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale)
      drawLine(field.l6, mapHeight, field.l6, 0, coverCtx, null, null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale)

      // Draw Center Circle
      coverCtx.beginPath()
      coverCtx.lineWidth = 3
      coverCtx.arc(this.getCanvasCoordinate(this.canvas2DPixelScale, 0).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight / 2).scaleY, 0.9 * this.canvas2DPixelScale, 0, Math.PI * 2, false)
      coverCtx.closePath()
      coverCtx.fillStyle = 'rgba(0,0,0,0)'
      coverCtx.strokeStyle = color
      coverCtx.fill()
      coverCtx.stroke()

      // Draw Left D
      coverCtx.beginPath()
      coverCtx.lineWidth = 3
      coverCtx.arc(this.getCanvasCoordinate(this.canvas2DPixelScale, -mapWidth / 2).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight / 2).scaleY, 4.9 * this.canvas2DPixelScale, Math.PI * 1.5, Math.PI * 0.5, false)
      coverCtx.closePath()
      coverCtx.fillStyle = 'rgba(0,0,0,0)'
      coverCtx.strokeStyle = color
      coverCtx.fill()
      coverCtx.stroke()

      // Draw right D
      coverCtx.beginPath()
      coverCtx.lineWidth = 3
      coverCtx.arc(this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight / 2).scaleY, 4.9 * this.canvas2DPixelScale, Math.PI * 0.5, Math.PI * 1.5, false)
      coverCtx.closePath()
      coverCtx.fillStyle = 'rgba(0,0,0,0)'
      coverCtx.strokeStyle = color
      coverCtx.fill()
      coverCtx.stroke()

    }
    this.drawRugbyXLines = (color) => {
      const { mapWidth, mapHeight, coverCtx, field } = this

      // coverCtx.beginPath()
      // coverCtx.lineWidth = 3;
      // coverCtx.strokeStyle = color;
      // coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, 0).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY);
      // coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, 0).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, -2).scaleY);
      // coverCtx.stroke();

      coverCtx.beginPath()
      coverCtx.setLineDash([0]);
      coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 + field.l1)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 + field.l1)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2 + field.l10).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2 + field.l10).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 + field.l1)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY);
      coverCtx.lineWidth = 3;
      coverCtx.strokeStyle = color;
      coverCtx.stroke();

      // Halfway line
      drawLine(0, 0, 0, mapHeight, coverCtx, null, null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);

      // Trylines
      drawLine(-(mapWidth / 2), mapHeight, -(mapWidth / 2), 0, coverCtx, null, 3, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
      drawLine(mapWidth / 2, mapHeight, mapWidth / 2, 0, coverCtx, null, 3, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);

      // Fill try zone with black and rugbyx logo
      coverCtx.fillStyle = '#1F2021';
      coverCtx.fillRect(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2) - field.l1).scaleX + 1.5, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY + 1.5, field.l1 * this.canvas2DPixelScale - 3, mapHeight * this.canvas2DPixelScale - 3)
      coverCtx.fillRect(this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2).scaleX + 1.5, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY + 1.5, field.l1 * this.canvas2DPixelScale - 3, mapHeight * this.canvas2DPixelScale - 3)


      let logoHeight = 150
      let logoWidth = logoHeight / 3.33

      var leftImg = new Image()
      leftImg.onload = () => {
        coverCtx.drawImage(leftImg, this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2) - field.l1 / 2).scaleX - logoWidth / 2, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight / 2).scaleY - logoHeight / 2, logoWidth, logoHeight)
      }
      leftImg.src = rugbyXLogoLeft

      var rightImg = new Image()
      rightImg.onload = () => {
        coverCtx.drawImage(rightImg, this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2 + field.l1 / 2).scaleX - logoWidth / 2, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight / 2).scaleY - logoHeight / 2, logoWidth, logoHeight)
      }
      rightImg.src = rugbyXLogoRight

      // Draw mid line
      const { dashSizeX, dashSizeY } = field
      drawLine(-field.l5, mapHeight, -field.l5, 0, coverCtx, [dashSizeY, dashSizeY], null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
      drawLine(field.l5, mapHeight, field.l5, 0, coverCtx, [dashSizeY, dashSizeY], null, color, this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
    }
    this.drawNFLLines = (color) => {
      const { mapWidth, mapHeight, coverCtx, field, poles } = this

      const yardInMeters = 0.9144;
      const endZone = yardInMeters*10

      coverCtx.beginPath()
      coverCtx.setLineDash([0]);
      coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 + endZone)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 + endZone)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2 + endZone).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2 + endZone).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY);
      coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 + endZone)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY);
      coverCtx.lineWidth = 3;
      coverCtx.strokeStyle = color;
      coverCtx.stroke();


      // Drawing 10 yard markers
      coverCtx.beginPath()
      coverCtx.setLineDash([0]);
      for (var i = 0; i < 11; i++) {
        if (i > 0 && i < 10) {
          var title = 50 - Math.abs((i*10) - 50)
          coverCtx.font = "40px Arial";
          coverCtx.fillStyle = color;
          coverCtx.textAlign = "center";
          coverCtx.fillText(title, this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (endZone * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight - 10).scaleY);
        }
        coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (endZone * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY);
        coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (endZone * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY);
      }
      coverCtx.lineWidth = 3;
      coverCtx.strokeStyle = color;
      coverCtx.stroke();

      // Draw 5 yard markers
      coverCtx.beginPath()
      coverCtx.setLineDash([0]);
      for (var i = 1; i < 11; i++) {
        coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (endZone * i) + endZone/2)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY);
        coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (endZone * i) + endZone/2)).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight).scaleY);
      }
      coverCtx.lineWidth = 1;
      coverCtx.strokeStyle = color;
      coverCtx.stroke();

      // Draw 1 yard markers
      coverCtx.beginPath()
      coverCtx.setLineDash([0]);
      for (var i = 0; i < 100; i++) {
        // Drawing side line markers
        coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (yardInMeters * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 1).scaleY);
        coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (yardInMeters * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 3).scaleY);
        coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (yardInMeters * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight - 3).scaleY);
        coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (yardInMeters * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight - 1).scaleY);
        // Drawing mid pitch markers
        coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (yardInMeters * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight/2 - 5).scaleY);
        coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (yardInMeters * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight/2 - 7).scaleY);
        coverCtx.moveTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (yardInMeters * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight/2 + 7).scaleY);
        coverCtx.lineTo(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2 - (yardInMeters * i))).scaleX, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight/2 + 5).scaleY);
      }
      coverCtx.lineWidth = 1;
      coverCtx.strokeStyle = color;
      coverCtx.stroke();

      // Fill try zone with black and rugbyx logo
      coverCtx.fillStyle = '#056b45';
      coverCtx.fillRect(this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2)).scaleX + 2, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY + 2, endZone * this.canvas2DPixelScale - 3, mapHeight * this.canvas2DPixelScale - 3)
      coverCtx.fillRect(this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2 + endZone).scaleX + 2, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY + 2, endZone * this.canvas2DPixelScale - 3, mapHeight * this.canvas2DPixelScale - 3)

      // Draw NFL Logo
      let logoHeight = 75
      let logoWidth = 75

      var leftImg = new Image()
      leftImg.onload = () => {
        coverCtx.drawImage(leftImg, this.getCanvasCoordinate(this.canvas2DPixelScale, -(mapWidth / 2) - endZone / 2).scaleX - logoWidth / 2, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight / 2).scaleY - logoHeight / 2, logoWidth, logoHeight)
      }
      leftImg.src = nflLogo

      var rightImg = new Image()
      rightImg.onload = () => {
        coverCtx.drawImage(rightImg, this.getCanvasCoordinate(this.canvas2DPixelScale, mapWidth / 2 + endZone / 2).scaleX - logoWidth / 2, this.getCanvasCoordinate(this.canvas2DPixelScale, null, mapHeight / 2).scaleY - logoHeight / 2, logoWidth, logoHeight)
      }
      rightImg.src = nflLogo

      // Draw poles
      this.drawCircle(-(mapWidth / 2 + endZone), (mapHeight / 2) - (poles.width / 2), coverCtx, 3, color)
      this.drawCircle(-(mapWidth / 2 + endZone), (mapHeight / 2) + (poles.width / 2), coverCtx, 3, color)

      this.drawCircle(mapWidth / 2 + endZone, (mapHeight / 2) - (poles.width / 2), coverCtx, 3, color)
      this.drawCircle(mapWidth / 2 + endZone, (mapHeight / 2) + (poles.width / 2), coverCtx, 3, color)
    }

    // rendering data on session summary. Live session sets to true on initiate.
    this.playbackPaused = false
    this.stopRenderLoop = false
    this.pausedRenderSpeed = 500 // 2 frames per second
    this.playingRenderSpeed = 50 // 20 frames per second

    this.stopMapLoop = () => {
      this.stopRenderLoop = true
    }

    this.calculateAnchorRadius = (tag, anchor, meas) => {
      const h = meas,
        y = Math.abs(anchor.pos.z - tag.z)
      let radius =  Math.sqrt(Math.pow(h, 2) - Math.pow(y, 2))
      radius = radius * this.canvas2DPixelScale
      return radius
    }

    this.showSessionTracking = false



    this.loop = () => {
      //--> Map
      if (this.view === "2D") {
        this.runBufferPos(null, () => {
          this.clearMapFrame(this.mapCtx)
          if (this.diags.active) {

            // Run diags tool canvas updates

            // for (let key in this.mapObjects) {
            //   let tag = this.mapObjects[key]
            //   if (this.diags.selectedTag.id === key) {
            //     this.drawCircle(tag.x, tag.y, this.mapCtx, 4, 'red')
            //   }
            //
            // }

            if (this.diags.viewAlltags) {
              for (let key in this.mapObjects) {
                let tag = this.mapObjects[key]
                this.drawCircle(tag.x, tag.y, this.mapCtx, 3, '#0099CC' , '#0099CC')
                this.drawCircle(tag.x, tag.y, this.mapCtx, 7, '#0099CC')
              }
            } else {
              // Draw anchor measurements in diags. Don't draw in a session
              let tag = this.mapObjects[this.diags.selectedTag.id]
              for (let key in this.mapObjects) {
                let tag = this.mapObjects[key]

                this.drawCircle(tag.x, tag.y, this.mapCtx, 3, 'yellow' , '#yellow')
                this.drawCircle(tag.x, tag.y, this.mapCtx, 7, 'yellow')
              }
              if (tag) {
                if (tag.meas) {
                  for (var i = 0; i < tag.meas.length; i++) {
                    let anchorMeas = tag.meas[i]
                    let anchor = this.diags.selectedAnchors.find(selectedAnchor => anchorMeas.anchor === selectedAnchor.id)
                    if (anchor) {
                      let { scaleX, scaleY } = this.getCanvasCoordinate(this.canvas2DPixelScale, anchor.pos.x, anchor.pos.y)
                      this.mapCtx.beginPath()
                      this.mapCtx.arc(scaleX, scaleY, this.calculateAnchorRadius(tag, anchor, tag.meas[i].dist), 0, 2 * Math.PI)
                      this.mapCtx.lineWidth = 1
                      this.mapCtx.strokeStyle = 'rgba(0,0,0,0.6)'
                      this.mapCtx.stroke()
                    }
                  }
                  this.drawCircle(tag.x, tag.y, this.mapCtx, 3, '#0099CC' , '#0099CC')
                  this.drawCircle(tag.x, tag.y, this.mapCtx, 7, '#0099CC')
                }
              }
            }
          } else if (this.sessionTags && this.showSessionTracking) {
            if (this.areasOfAccessActive) AreasOfAccess.getRefLines();

            // Update player position in the defensive line
            for (let key in this.mapObjects) {
              let player = this.mapObjects[key],
                { x, y, t, playerId, vel } = player,
                { scaleX, scaleY } = this.getCanvasCoordinate(this.canvas2DPixelScale, x, y);
              if (t) {
                let linePlayer = this.defensiveLines[t].players.find(x => x.id == playerId);
                if (linePlayer) {
                  linePlayer.position = {x: scaleX, y: scaleY}
                  linePlayer.vel = vel
                }
              }
            };

            // Update player position player trails
            for (let key in this.trails.players) {
              if (this.mapObjects[key]) {
                let player = this.trails.players[key],
                  {x, y} = this.mapObjects[key],
                  { scaleX, scaleY } = this.getCanvasCoordinate(this.canvas2DPixelScale, x, y);
                player.ctx.fillStyle = 'blue'
                player.ctx.fillRect(scaleX,scaleY,2,2);
              }
            }

            // Update selected player
            if (this.selectedPlayer.tagId) {
              this.selectedPlayer = this.mapObjects[this.selectedPlayer.tagId]
            }

            // Draw defensive line
            if (this.defensiveLines.active) {
              if (this.defensiveLines["A"].active) this.drawDefensiveLines("A");
              if (this.defensiveLines["B"].active) this.drawDefensiveLines("B");
            }

            let breakDownLine = {};

            // Draw players on the canvas

            let timeNowInSeconds = new Date().getTime() / 1000
            for (let key in this.mapObjects) {
              if (this.players2D[key]) {
                let player = this.mapObjects[key]
                let { x, y, t, n, playerId } = player

                let { scaleX, scaleY } = this.getCanvasCoordinate(this.canvas2DPixelScale, x, y);
                if (this.breakdownLineActive) {
                  let line = this.calculateBreakDownLine(key, x, y);
                  breakDownLine = line
                }

                if (timeNowInSeconds - player.timestamp < 120) {
                  this.mapCtx.save()
                  if (timeNowInSeconds - player.timestamp > 5) this.mapCtx.globalAlpha = 0.4

                  if (this.selectedTag === key) {
                    this.mapCtx.drawImage(this.tags2DSelected[t], scaleX - this.tags2DSelectedSize / 2, scaleY - this.tags2DSelectedSize / 2);
                  } else {
                    this.mapCtx.drawImage(this.players2D[key].player, scaleX - this.player2DSize / 2, scaleY - this.player2DSize / 2);
                  }
                  this.mapCtx.restore()
                }
              }
            }

            // Draw balls on canvas
            for (let key in this.mapObjects) {
              if (this.balls2D[key]) {
                let ball = this.mapObjects[key]
                let { x, y, t, n } = ball

                let { scaleX, scaleY } = this.getCanvasCoordinate(this.canvas2DPixelScale, x, y)
                // this.drawMapCircle(this.mapCtx, scaleX, scaleY, t, n, true);

                if (timeNowInSeconds - ball.timestamp < 120) {
                  this.mapCtx.save()
                  if (timeNowInSeconds - ball.timestamp > 5) this.mapCtx.globalAlpha = 0.4

                  if (this.selectedTag === key) {
                    this.mapCtx.drawImage(this.tags2DSelected['ball'], scaleX - this.tags2DSelectedSize / 2, scaleY - this.tags2DSelectedSize / 2)
                  } else{
                    this.mapCtx.drawImage(this.balls2D[key].ball, scaleX - this.ball2DSize / 2, scaleY - this.ball2DSize / 2)
                  }

                  this.mapCtx.restore()
                }

              }
            }

            // draw arrows on canvas

            const { mapWidth, mapHeight } = this;
            if (this.kickDirection === -1){
              this.drawArrow(-(mapWidth / 2 + 1), (mapHeight/1.5), -(mapWidth / 2 + 4), (mapHeight/1.5),'#0099CC')
              this.drawArrow(-(mapWidth / 2 + 1), (mapHeight/2), -(mapWidth / 2 + 4), (mapHeight/2),'#0099CC')
              this.drawArrow(-(mapWidth / 2 + 1), (mapHeight/3), -(mapWidth / 2 + 4), (mapHeight/3),'#0099CC')
            } else if(this.kickDirection === 1){
              this.drawArrow((mapWidth / 2 + 1), (mapHeight/1.5), (mapWidth / 2 + 4), (mapHeight/1.5),'#0099CC')
              this.drawArrow((mapWidth / 2 + 1), (mapHeight/2), (mapWidth / 2 + 4), (mapHeight/2),'#0099CC')
              this.drawArrow((mapWidth / 2 + 1), (mapHeight/3), (mapWidth / 2 + 4), (mapHeight/3),'#0099CC')
            }

            if (breakDownLine) {
              let { canvasCoord, yBoundLower, yBoundUpper } = breakDownLine;
              if (canvasCoord && yBoundLower && yBoundUpper) {
                this.mapCtx.beginPath();
                this.mapCtx.moveTo(canvasCoord.scaleX,yBoundLower.scaleY);
                this.mapCtx.lineTo(canvasCoord.scaleX,yBoundUpper.scaleY);
                this.mapCtx.lineWidth = 6;
                this.mapCtx.strokeStyle = 'rgba(0,255,0,1)';
                this.mapCtx.stroke();
              }
            }
          }
        })
      }

      //--> Loop Handler

      this.loopCounter++;
      if (this.loopCounter > 1000)
        this.loopCounter = 0;
      if (!this.stopRenderLoop) {
        setTimeout(this.loop, this.playbackPaused ? this.pausedRenderSpeed : this.playingRenderSpeed);
      } else if (this.stopRenderLoop) {
        // reset render stop conditional
        this.stopRenderLoop = false
      }
    };

    this.getFurthestAnchorsFromSidelines = (field) => {

      let xAnchor = 0, yAnchor = 0
      for (let key in this.anchorConfig) {
        let { pos } = this.anchorConfig[key]
        let x = Math.abs(pos.x),
          y = pos.y
        if (x > xAnchor) {
          xAnchor = x
        }
        if (y < 0) {
          y = Math.abs(pos.y)
          if (y > yAnchor) {
            yAnchor = y
          }
        } else {
          y = y - field.height
          if (y > yAnchor) {
            yAnchor = y
          }
        }
      }

      xAnchor = xAnchor - field.width / 2

      return { xAnchor, yAnchor }
    }

    this.calculateOffsetAndScale = (field, goalAreaLength) => {
      // Set larger offset for diagnostics so anchors are visible
      // calculate offsets and scale depending on aspect ratio and anchor position

      let sectionRatio = this.canvasSectionWidth / this.canvasHeight
      let pitchRatio = field.width / field.height

      let minOffsetX = 5
      let minOffsetY = 5

      const pitchOffsetCalculator = (minX, minY) => {
        let mapOffsetX, mapOffsetY, scale
        if (minX) {
          mapOffsetX = minX + goalAreaLength
          mapOffsetY = (2 * mapOffsetX * this.canvasHeight + this.canvasHeight * this.mapWidth - this.canvasSectionWidth * this.mapHeight) / (this.canvasSectionWidth * 2)
          scale = this.canvasHeight / (this.mapHeight + mapOffsetY * 2)
        } else {
          mapOffsetY = minY
          // Set Scale
          scale = this.canvasHeight / (this.mapHeight + mapOffsetY * 2)
          mapOffsetX = (this.canvasSectionWidth / 2) / scale - this.mapWidth / 2
        }
        return {mapOffsetX, mapOffsetY, scale}
      }

      if (this.diags.active || this.anchorSetup.active) {
        let { xAnchor, yAnchor } = this.getFurthestAnchorsFromSidelines(field)
        if (xAnchor > yAnchor) {
          let o = pitchOffsetCalculator(xAnchor + 10)
          this.mapOffsetX = o.mapOffsetX
          this.mapOffsetY = o.mapOffsetY
          this.scale = o.scale
          if (o.mapOffsetY < yAnchor) {
            o = pitchOffsetCalculator(null, yAnchor + 10)
            this.mapOffsetX = o.mapOffsetX
            this.mapOffsetY = o.mapOffsetY
            this.scale = o.scale
          }
        } else {
          let o = pitchOffsetCalculator(yAnchor + 10)
          this.mapOffsetX = o.mapOffsetX
          this.mapOffsetY = o.mapOffsetY
          this.scale = o.scale
          if (o.mapOffsetX < xAnchor) {
            o = pitchOffsetCalculator(xAnchor + 10)
            this.mapOffsetX = o.mapOffsetX
            this.mapOffsetY = o.mapOffsetY
            this.scale = o.scale
          }
        }
      } else {
        if (sectionRatio < pitchRatio) {
          let { mapOffsetX, mapOffsetY, scale } = pitchOffsetCalculator(minOffsetX)
          this.mapOffsetX = mapOffsetX
          this.mapOffsetY = mapOffsetY
          this.scale = scale
        } else {
          let { mapOffsetX, mapOffsetY, scale } = pitchOffsetCalculator(null, minOffsetY)
          this.mapOffsetX = mapOffsetX
          this.mapOffsetY = mapOffsetY
          this.scale = scale
        }
      }
    }

    // Load 2D canvas map
    this.loadMap = () => {
      let { field } = this
      this.coverCanvas = document.getElementById(this.coverId)

      this.mapWidth = field.l2 + field.l3 + field.l4 + field.l5 + field.l6 + field.l7 + field.l8 + field.l9
      this.mapHeight = field.height

      // Set offset based on pitch type
      switch(this.pitchType) {
        case 0:
          this.calculateOffsetAndScale(field, field.l1)
          break
        case 1:
          this.mapOffsetX = 3.05
          this.mapOffsetY = 3.05
          break
        case 2:
          this.mapOffsetX = 10
          this.mapOffsetY = 2.5
          break
        case 3:
          field.width = 109.728
          field.height = 48.8
          this.mapWidth = 91.44
          this.mapHeight = field.height

          this.calculateOffsetAndScale(field, 9.144)
          break
        default:
          this.mapOffsetX = 20
          this.mapOffsetY = 5
          break
      }

      this.canvasElementPixelRatio = 1.2
      this.canvas2DPixelScale = this.scale * this.canvasElementPixelRatio
      this.canvasContainer.style.width = `${(this.mapWidth + this.mapOffsetX * 2) * this.scale}px`

      this.mapCtx = this.mapCanvas.getContext("2d")
      this.coverCtx = this.coverCanvas.getContext("2d")

      // Set scaled dimensions and position of canvas and cover
      //

      this.mapCanvas.style.width = `${(this.mapWidth + this.mapOffsetX * 2) * this.scale}px`
      this.mapCanvas.style.height = `${(this.mapHeight + this.mapOffsetY * 2) * this.scale}px`
      this.mapCanvas.width = (this.mapWidth + this.mapOffsetX * 2) * this.canvas2DPixelScale
      this.mapCanvas.height = (this.mapHeight + this.mapOffsetY * 2) * this.canvas2DPixelScale

      this.coverCanvas.style.top = `0px`
      this.coverCanvas.style.left = `0px`
      this.coverCanvas.style.background = field.color;
      this.coverCanvas.style.backgroundImage = `url(${pitchTexture})`

      this.coverCanvas.style.width = `${(this.mapWidth + this.mapOffsetX * 2) * this.scale}px`
      this.coverCanvas.style.height = `${(this.mapHeight + this.mapOffsetY * 2) * this.scale}px`
      this.coverCanvas.width = this.mapCanvas.width
      this.coverCanvas.height = this.mapCanvas.height

      // Initiate areas of access based on pitch dimensions
      AreasOfAccess.init(this.mapWidth, this.mapHeight, this.mapOffsetX, this.mapOffsetY, field.height, field.width, this.canvas2DPixelScale, this.canvasId2D)

      // Create rugby players
      this.create2DPlayersAndBall(this.sessionTags)

      // Draw pitch lines based on type
      switch(this.pitchType) {
        case 0:
          field.dashSizeY = field.height / (14 * (field.height / 70)) * this.canvasElementPixelRatio
          field.dashSizeX = field.tryLineDistance / (20 * (field.tryLineDistance / 100)) * this.canvasElementPixelRatio
          this.drawRugbyLines('rgba(255,255,255,0.9)')
          break
        case 1:
          this.drawNetballLines('white')
          break
        case 2:
          field.dashSizeY = field.height / (40 * (field.height / 32))
          field.dashSizeX = field.tryLineDistance / (20 * (field.tryLineDistance / 55))
          this.drawRugbyXLines('white')
          break
        case 3:
          field.dashSizeY = field.height / (14 * (field.height / 70)) * this.canvasElementPixelRatio
          field.dashSizeX = field.tryLineDistance / (20 * (field.tryLineDistance / 100)) * this.canvasElementPixelRatio
          this.drawNFLLines('rgba(255,255,255,0.9)')
          break
        default:
          field.dashSizeY = field.height / (14 * (field.height / 70)) * this.canvasElementPixelRatio
          field.dashSizeX = field.tryLineDistance / (20 * (field.tryLineDistance / 100)) * this.canvasElementPixelRatio
          this.drawRugbyLines('rgba(255,255,255,0.9)')
          break
      }

      // Draw anchors
      if (this.diags.active) {
        this.generateDiagsCanvas(this.anchorConfig)
      }

      if (this.anchorSetup.active) {
        this.generateAnchorSetupCanvas(this.anchorConfig)
      }

      // Draw person
      let personImgWidth = 30
      let personImg = new Image()
      personImg.src = personImgSrc
      personImg.onload = (event) => {
        this.coverCtx.drawImage(event.target, this.getCanvasCoordinate(this.canvas2DPixelScale, 0).scaleX - personImgWidth / 2, this.getCanvasCoordinate(this.canvas2DPixelScale, null, 0).scaleY, personImgWidth, personImgWidth)
      }

      this.mapCtx.fillStyle = "#006699";
      this.mapCtx.strokeStyle = "#009DDC";
      this.mapCtx.lineWidth = 3;
    };

    // Clear 2D canvas
    this.clearMapFrame = (ctx) => {
      ctx.clearRect(0, 0, (this.mapWidth + 2 * this.mapOffsetX) * this.canvas2DPixelScale, (this.mapHeight + 2 * this.mapOffsetY) * this.canvas2DPixelScale);
    };

    // Create Player and Ball clippings

    this.players2D = {};
    this.tags2DSelected = {};
    this.player2DSize = 20;
    this.ball2DSize = 20;
    this.tags2DSelectedSize = 34;

    this.create2DPlayersAndBall = (sessionTags) => {

      let playerTags = sessionTags.filter(x => x.playerId != 0),
        ballTags = sessionTags.filter(x => x.playerId == 0)

      this.players2D = {};
      this.balls2D = {};
      this.tags2DSelected = {};

      let playerSize = this.player2DSize,
        ballSize   = this.ball2DSize,
        tags2DSelectedSize = this.tags2DSelectedSize

      // generate plain and defline player circles
      for (let i = 0; i < playerTags.length; i++) {

        let playerCanvas = this.genCanvas(playerSize, playerSize),
          defLineCanvas = this.genCanvas(playerSize, playerSize),
          player = playerTags[i],
          team = player.teamId == this.teams.A.id ? "A" : "B"

        let color = player.teamId == this.teams.A.id ? this.teams.A.color : this.teams.B.color

        this.canvasContainer2D.append(playerCanvas);
        this.drawMapCircle(playerCanvas.getContext("2d"), playerSize / 2, playerSize / 2, team, player.playerNumber, false, null, color)
        this.canvasContainer2D.append(defLineCanvas);
        this.drawMapCircle(defLineCanvas.getContext("2d"), playerSize / 2, playerSize / 2, team, player.playerNumber, true, null, color)

        this.players2D[player.tagId] = {player: playerCanvas, defline: defLineCanvas}
      }

      for (let t in this.teams) {
        let team = this.teams[t]
        let selectedCanvas = this.genCanvas(tags2DSelectedSize, tags2DSelectedSize)
        let color = team.color
        this.canvasContainer2D.append(selectedCanvas)
        this.draw2DCircle(selectedCanvas.getContext("2d"), tags2DSelectedSize / 2, tags2DSelectedSize / 2, color, 'rgba(0, 0, 0, 0.4)', 9)
        this.draw2DCircle(selectedCanvas.getContext("2d"), tags2DSelectedSize / 2, tags2DSelectedSize / 2, 'yellow', 'rgba(0, 0, 0, 0)', 14, 3, [7, 5])
        this.tags2DSelected[t] = selectedCanvas
      }

      for (let i = 0; i < ballTags.length; i++) {

        let ball = ballTags[i]
        let ballCanvas = this.genCanvas(ballSize, ballSize)
        let selectedBallCanvas = this.genCanvas(ballSize, ballSize)

        this.canvasContainer2D.append(ballCanvas);
        this.drawMapCircle(ballCanvas.getContext("2d"), ballSize / 2, ballSize / 2, null, 24)
        this.canvasContainer2D.append(selectedBallCanvas);
        this.drawMapCircle(selectedBallCanvas.getContext("2d"), ballSize / 2, ballSize / 2, null, 24, null, true)

        this.balls2D[ball.tagId] = {ball: ballCanvas, selectedBall: selectedBallCanvas}
      }

      let selectedBallCanvas = this.genCanvas(tags2DSelectedSize, tags2DSelectedSize)
      this.canvasContainer2D.append(selectedBallCanvas)
      this.draw2DCircle(selectedBallCanvas.getContext("2d"), tags2DSelectedSize / 2, tags2DSelectedSize / 2, '#4e4e4e', '#fdff00', 9)
      this.draw2DCircle(selectedBallCanvas.getContext("2d"), tags2DSelectedSize / 2, tags2DSelectedSize / 2, 'yellow', 'rgba(0, 0, 0, 0)', 12, 3, [10, 5])
      this.tags2DSelected['ball'] = selectedBallCanvas
    }

    this.tagData = {
      devices: {}
    }

    this.updateOnlineTagData = (devices) => {
      if (JSON.stringify(devices) !== JSON.stringify(this.tagData.devices)) {
        this.tagData.devices = devices
      }
    }

    //----> Pitch Setup

    this.anchorSetup = {
      active: false,
      devices: {},
      anchorsOnline: []
    }

    this.generateAnchorSetupCanvas = (anchors) => {
      this.anchorSetup.canvas = document.createElement('canvas')
      this.anchorSetup.eventHandleCanvas = document.createElement('canvas')


      this.appendTo2dCanvas(this.anchorSetup.canvas, 'anchorCanvas')
      this.appendTo2dCanvas(this.anchorSetup.eventHandleCanvas, "anchorCanvas")
      this.anchorSetup.eventHandleCanvas.style.zIndex = 2
      this.anchorSetup.ctx = this.anchorSetup.canvas.getContext("2d")
      this.anchorSetup.eventCtx = this.anchorSetup.eventHandleCanvas.getContext("2d")

      this.updateAnchorSetupAnchors(anchors)
    }

    this.updateOnlineAnchorData = (devices) => {
      if (JSON.stringify(devices) !== JSON.stringify(this.anchorSetup.devices)) {
        this.anchorSetup.devices = devices
        this.updateAnchorSetupAnchors(this.anchorConfig)
      }
    }

    this.updateAnchorsOnline = (anchorsOnline) => {
      if (JSON.stringify(anchorsOnline) !== JSON.stringify(this.anchorSetup.anchorsOnline)) {
        this.anchorSetup.anchorsOnline = anchorsOnline
        this.updateAnchorSetupAnchors(this.anchorConfig)
      }
    }

    this.updateAnchorSetupAnchors = (anchors) => {
      this.drawAnchors(_.values(anchors), this.anchorSetup.ctx)
    }

    this.updateSelectedSide = (side) => {
      this.anchorSetup.direction = side
      this.updateAnchorSetupAnchors(this.anchorConfig)
    }

    this.pitchSetupCanvasClickHandle = (e, stateUpdate) => {
      let { offsetX, offsetY } = e
      let rightTenMeterLine = this.getCanvasCoordinate(this.scale, this.dimensions.P7.x)
      let leftTenMeterLine = this.getCanvasCoordinate(this.scale, this.dimensions.P5.x)

      if (this.anchorSetup.direction < 0) {
        if (rightTenMeterLine.scaleX < offsetX) stateUpdate(1)
      } else if (this.anchorSetup.direction > 0) {
        if (offsetX < leftTenMeterLine.scaleX) stateUpdate(-1)
      }
    }

    this.drawArrow = (ctx, x, y, width, height, direction) => {
      let img = new Image()
      if (direction === 'left') {
        img.src = leftArrow
      } else {
        img.src = rightArrow
      }
      img.onload = (event) => {
        ctx.drawImage(event.target, this.getCanvasCoordinate(this.canvas2DPixelScale, x).scaleX - width / 2, this.getCanvasCoordinate(this.canvas2DPixelScale, null, y).scaleY - height / 2, width, height)
      }
    }

    this.drawSelectedSide = (side, ctx) => {

      let rightTenMeter = this.dimensions.P7.x - this.dimensions.P6.x
      let leftTenMeter = this.dimensions.P6.x - this.dimensions.P5.x

      let leftOrigin = this.getCanvasCoordinate(this.canvas2DPixelScale, this.dimensions.P25.x, this.dimensions.P25.y)
      let rightOrigin = this.getCanvasCoordinate(this.canvas2DPixelScale, this.dimensions.P21.x - leftTenMeter, this.dimensions.P21.y)
      let rightFillOrigin = this.getCanvasCoordinate(this.canvas2DPixelScale, this.dimensions.P21.x + rightTenMeter, this.dimensions.P21.y)
      if (side === 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(leftOrigin.scaleX, leftOrigin.scaleY, (this.field.tryLineDistance / 2 - leftTenMeter) * this.canvas2DPixelScale, this.field.height * this.canvas2DPixelScale)

        ctx.setLineDash([10])
        ctx.lineWidth = 3
        ctx.strokeStyle = 'yellow'
        ctx.strokeRect(rightOrigin.scaleX + 5, rightOrigin.scaleY + 5, (this.field.tryLineDistance / 2 + leftTenMeter) * this.canvas2DPixelScale - 10, this.field.height * this.canvas2DPixelScale - 10)

        this.drawArrow(ctx, this.dimensions.P8.x, this.field.height / 3 * 2, 80, 70, 'right')
        this.drawArrow(ctx, this.dimensions.P8.x, this.field.height / 3 * 1, 80, 70, 'right')
      } else if (side === -1) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(rightFillOrigin.scaleX, rightFillOrigin.scaleY, (this.field.tryLineDistance / 2 - rightTenMeter) * this.canvas2DPixelScale, this.field.height * this.canvas2DPixelScale)

        ctx.setLineDash([10])
        ctx.strokeStyle = 'yellow'
        ctx.lineWidth = 3
        ctx.strokeRect(leftOrigin.scaleX + 5, leftOrigin.scaleY + 5, (this.field.tryLineDistance / 2 + rightTenMeter) * this.canvas2DPixelScale - 10, this.field.height * this.canvas2DPixelScale - 10)

        this.drawArrow(ctx, this.dimensions.P4.x, this.field.height / 3 * 2, 80, 70, 'left')
        this.drawArrow(ctx, this.dimensions.P4.x, this.field.height / 3 * 1, 80, 70, 'left')
      } else {
        ctx.setLineDash([10])
        ctx.strokeStyle = 'yellow'
        ctx.lineWidth = 3
        ctx.strokeRect(leftOrigin.scaleX + 5, leftOrigin.scaleY + 5, this.field.tryLineDistance * this.canvas2DPixelScale - 10, this.field.height * this.canvas2DPixelScale - 10)

        this.drawCircle(0, 0, ctx, 10, 'black', 'blue')
        this.drawCircle(this.dimensions.P19.x, this.dimensions.P19.y, ctx, 10, 'black', 'red')
        this.drawCircle(this.dimensions.P10.x, 0, ctx, 10, 'black', 'orange')
      }
      ctx.setLineDash([])
    }

    //-----> Targets

    this.targets = {
      active: false,
      targets: []
    }

    this.initiateTargetCanvas = (eventListenerCallback) => {
      this.targets.active = true;
      if (this.mapCtx) this.clearMapFrame(this.mapCtx)
      this.targets.canvas = document.createElement('canvas')
      this.targets.eventHandleCanvas = document.createElement('canvas')

      this.appendTo2dCanvas(this.targets.canvas, "targetCanvas")
      this.appendTo2dCanvas(this.targets.eventHandleCanvas, "targetCanvas")

      this.targets.eventHandleCanvas.style.zIndex = 2

      this.targets.ctx = this.targets.canvas.getContext("2d")

      // Add event listeners to events canvas

      eventListenerCallback()
    }

    this.drawTargets = (newTargets, selectedTarget, setSelectedTarget, updateTargetPosition) => {
      this.targets.targets = newTargets
      const { targets } = this.targets

      this.removeCanvases('targetCanvas')

      for (let i = 0; i < targets.length; i++) {
        let target = targets[i]
        if (target.radii) {
          drawPointTarget(this, this.scale, target, selectedTarget, setSelectedTarget, updateTargetPosition)
        }
      }
    }

    //----> Diagnostics

    this.diags = {
      active: false,
      selectedTag: {},
      viewAlltags: false,
      tagLabels: {}
    }

    this.generateDiagsCanvas = (anchors) => {
      this.diags.canvas = document.createElement('canvas')
      this.appendTo2dCanvas(this.diags.canvas, 'diagsCanvas')
      this.diags.ctx = this.diags.canvas.getContext("2d")

      this.updateSelectedAnchors(_.values(this.anchorConfig), this.diags.ctx)
    }

    this.updateSelectedAnchors = (selectedAnchors, ctx) => {
      this.diags.selectedAnchors = selectedAnchors
      this.drawAnchors(selectedAnchors, ctx)
    }
    //=-----> Draw Anchors

    this.drawAnchors = (anchorsArray, ctx) => {

      this.clearMapFrame(ctx)

      if (this.anchorSetup.active) {
        this.drawSelectedSide(this.anchorSetup.direction, this.anchorSetup.ctx)
      }

      return

      let anchorImgWidth = 70

      let anchorsOffline = !anchorsArray.some(anchor => anchor.pos.x || anchor.pos.y || anchor.pos.z)

      if (anchorsOffline) {
        console.log('All anchors showing position 0, 0, 0')
        return
      }

      const { anchorsOnline } = this.anchorSetup

      anchorsArray
        .filter(anchor => anchor.id != 0)
        .forEach(anchor => {
          // this.drawCircle(anchor.pos.x, anchor.pos.y, ctx, 3, 'black', 'black')
          if (anchorsOnline.indexOf(anchor.id) >= 0) {
            this.drawCircle(anchor.pos.x, anchor.pos.y, ctx, 5, 'rgba(246, 0, 0, 1)')
            this.drawCircle(anchor.pos.x, anchor.pos.y, ctx, 7, 'rgba(246, 0, 0, 0.8)')
            this.drawCircle(anchor.pos.x, anchor.pos.y, ctx, 10, 'rgba(246, 0, 0,0.6)')
            this.drawCircle(anchor.pos.x, anchor.pos.y, ctx, 15, 'rgba(246, 0, 0,0.4)')
          }
        })

      const drawAnchor = (anchor, event) => {
        let yImageOffset = -10 - anchorImgWidth
        let xImageOffset = -anchorImgWidth / 2
        let yTextOffset = - (anchorImgWidth - anchorImgWidth / 3.65) - 2
        let xTextOffset = - anchorImgWidth / 3.5

        if (this.pitchFlipped) {
          if (anchor.pos.y < 35) {
            yImageOffset = 10
            yTextOffset = anchorImgWidth / 3.65 + 10 + 8
          }
        } else {
          if (anchor.pos.y > 35) {
            yImageOffset = 10
            yTextOffset = anchorImgWidth / 3.65 + 10 + 8
          }
        }

        if (anchorsOnline.indexOf(anchor.id) < 0) ctx.globalAlpha = 0.7
        ctx.drawImage(event.target, this.getCanvasCoordinate(this.canvas2DPixelScale, anchor.pos.x).scaleX + xImageOffset, this.getCanvasCoordinate(this.canvas2DPixelScale, null, anchor.pos.y).scaleY + yImageOffset, anchorImgWidth, anchorImgWidth)
        this.drawTextBox(anchor.encodedId, anchor.pos.x, anchor.pos.y, "10px Mark Pro", "black", ctx, xTextOffset, yTextOffset)
        ctx.globalAlpha = 1
      }

      for (let key in this.anchorConfig) {
        let anchor = this.anchorConfig[key]



        if (anchor.id != 0) {

          this.drawCircle(anchor.pos.x, anchor.pos.y, ctx, 3, 'black', 'black')

          var img = new Image()
          img.src = anchorImg

          let anchorInfo = this.anchorSetup.devices[anchor.id]

          // Batt
          if (anchorInfo) {
            img.src = getBatteryLevel(anchorInfo.battery).anchorImg
          }

          img.onload = (event) => {
            drawAnchor(anchor, event)
          }
        }
      }
      // this.drawCircle(x, y, this.coverCtx, 18, 'rgba(0,0,0,0.1)')
    }

    //--> Generate 2D Canvas
    this.genCanvas = (width, height) => {
      let canvas = document.createElement('canvas');
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width * this.canvas2DPixelScale;
      canvas.height = height * this.canvas2DPixelScale;
      canvas.style.display = 'none';
      canvas.style.position = 'absolute';
      return canvas;
    }

    this.maBuff = {}

    this.updateBuffer = (data, tag, replayData) => {

      // Code for Rugby X and netball purposes only, needs to be set to 0 if actual rugby x or netball installation exists
      // This is an offset for a mock rugby x pitch draw out at ealing
      // default value if not provided is 0
      data.pos.x = data.pos.x + this.ealingOffset.x
      data.pos.y = data.pos.y + this.ealingOffset.y

      if (replayData && tag) {
        // buffer with moving avaerage filter
        let { maBuff } = this

        let { tagId } = data
        if (!tagId) tagId = data.id

        if (!this.buffer.hasOwnProperty(tagId)) {
          console.log('== NEW TAG! : ' + data.tagId + ' :' + tagId + ' ==');
          this.buffer[tagId] = [];
          maBuff[tagId] = [];
        }
        while (this.buffer[tagId].length > 10) {
          this.buffer[tagId].shift();
        }
        if (data.pos.x !== 0 && data.pos.y !== 0) {
          let window = 10;
          if (maBuff[tagId].length > window) {
            PositionMap.updateMap(movingAverage(maBuff[tagId], window))
            AreasOfAccess.updateMap(movingAverage(maBuff[tagId], window), tag)
            this.buffer[tagId].push(movingAverage(maBuff[tagId],window))
            maBuff[tagId].shift()
          }
          maBuff[tagId].push(data)
        }
      } else {
        // buffer without moving average applied
        if (!!data && (data.pos.x !== 0 && data.pos.y !== 0)) {

          PositionMap.updateMap(data);

          if (tag) {
            AreasOfAccess.updateMap(data, tag)
          }

          let { tagId } = data
          if (!tagId) tagId = data.id

          if (!this.buffer.hasOwnProperty(tagId)) {
            console.log('== NEW TAG! : ' + tagId + ' :' + tagId + ' ==');
            this.buffer[tagId] = [];
          }
          while (this.buffer[tagId].length > 3) {
            this.buffer[tagId].shift();
          }
          this.buffer[tagId].push(data);
        }
      }
    }

    this.clearBuffers = () => {
      this.mapObjects = {}
      this.buffer = {}
      this.maBuff = {}
    }

    this.runBufferPos = (setPos, cb) => {

      let { field } = this
      this.bufferHasData = false;

      for (var key in this.buffer) {
        var timeData = false;
        //--> Push Buffer Length for Each Tag

        let player = this.players[key];
        if (!player) {
          player = this.balls[key];
        }

        if (this.buffer[key].length > 1) {
          var q = 0;
          var i = 0;
          var prevBuffer = this.buffer[key][0];
          var t1 = 0;
          var t2 = 0;

          for (i = 1; i < this.buffer[key].length; i++) {

            this.bufferHasData = true;

            var buffer = this.buffer[key][i];

            t1 = Math.round(prevBuffer.timestamp * 1000);
            t2 = Math.round(buffer.timestamp * 1000);

            var x;
            var y;
            var z;
            if (t1  !== t2) {
              x = this.interpolate(prevBuffer.pos.x, buffer.pos.x, t1, t2, t2);
              y = this.interpolate(prevBuffer.pos.y, buffer.pos.y, t1, t2, t2);
              if (!fixedZ) {
                // Fix z for players but not ball
                (!buffer.ball) ? z = this.fixedZHeight : z = this.interpolate(prevBuffer.pos.z, buffer.pos.z, t1, t2, t2);
              } else {
                // Fix z for both players and ball
                z = this.fixedZHeight
              }
            } else {
              x = buffer.pos.x
              y = buffer.pos.y
              if (!fixedZ) {
                // Fix z for players but not ball
                (!buffer.ball) ? z = this.fixedZHeight : z = this.interpolate(prevBuffer.pos.z, buffer.pos.z, t1, t2, t2);
              } else {
                // Fix z for both players and ball
                z = this.fixedZHeight
              }
            }

            if (z < 0) {
              z = 0
            }

            z += this.playerSphereDiameter / 2.0 //so spheres sit above plane

            //--> TODO : Interpolate
            if (key === this.playerSelected) {
              this.playerStats.vMag = buffer.Vmag;
              this.stGaugeGo(1, Math.round(buffer.Vmag / 13.9 * 100));
            }

            //--> If Ball
            if (key === this.ballSelected) {
              this.ballStats = {
                vMag: buffer.Vmag,
                z: z
              };
              this.stGaugeGo(2, Math.round(buffer.Vmag / 55.5 * 100));
            }

            //--> Draw circle on map
            if (!this.mapObjects.hasOwnProperty(key)) {
              this.mapObjects[key] = {
                x: 0,
                y: 0,
                z: 0,
                t: player ? player.team : '',
                n: player ? player.number : '',
                playerId: player ? player.playerId : '',
                ball: player ? player.ball : false
              }
            }

            this.mapObjects[key].x = x;
            this.mapObjects[key].y = y;
            this.mapObjects[key].z = z;
            this.mapObjects[key].vel = this.buffer[key][i].vel;
            this.mapObjects[key].timestamp = this.buffer[key][i].timestamp;

            // record measurements if in diags mode
            if (this.diags.active) {
              this.mapObjects[key].meas = this.buffer[key][i].meas
            }

            //--> Data Was Received
            timeData = true;

            //--> Set Position
            if (x !== 0 && y !== 0) {
              if (setPos) setPos(player.team, key, x, y, z);
            }
            break;
          }

          //--> If Found Correct Record in Buffer, clear till it
          if (timeData && !this.playbackPaused) {
            while (q < i) {
              this.buffer[key].shift();
              q++;
            }
          } else if (this.events.active) {
            if (setPos) setPos(player.team, key, -this.playersXpos, this.playersSpacing * (player.number - 1) - field.edges, 0)
          }
          this.timeCalc = false;
        }
      }
      if (cb) {
        cb();
      } else {
        this.scene.render();
      }
    }

    this.switchView = (view) => {
      this.view = view
    }

    // Build Babylon 3D canvas for live and replay session and run renderloop
    this.load = (callback) => {
      //--> Load engine to canvas
      this.canvas = document.getElementById(this.canvasId3D);
      this.canvas.height = parseInt(this.canvasHeight, 10);
      this.canvas.width = this.canvasWidth;
      this.engine = new BABYLON.Engine(this.canvas, true, null, false);

      //--> Add listeners to pitch
      window.addEventListener("dblclick", (e) => {
        var pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY)
        if (pickResult.hit) {
          if (pickResult.pickedMesh.id === 'ground') {
            this.changeCameraTarget(pickResult.pickedPoint)
          }
        }
      })

      //--> Create scene and load models
      this.createScene()

      //--> Animation RenderLoop
      const optimizationSettings = BABYLON.SceneOptimizerOptions.HighDegradationAllowed();
      optimizationSettings.targetframerate = 30;


      BABYLON.SceneOptimizer.OptimizeAsync(
        this.scene,
        optimizationSettings,
        () =>
        {
          // const bufferWorker = new WebWorker(BufferWorker);
          // Stop loading and set canvas to ready
          callback();

          this.engine.runRenderLoop(() => {
            if (this.view === "3D") {
              this.runBufferPos(this.setPos.bind(this), null);
            } else {
              this.scene.render();
            }
          });


          // ---------> Rugby Ball
          // BABYLON.SceneLoader.ImportMesh("", "/static/scenes/", rugbyBallMesh.split("/")[3], this.scene, function (newMeshes) {
          //     // Set the target of the camera to the first imported mesh
          //     console.log(newMeshes)
          // });


        },
        function()
        {
          console.error("The engine can't init");
        }
      );
    };

    /* change arc rotate camera target vector */
    this.changeCameraTarget = (target) => {
      this.camera.setTarget(new BABYLON.Vector3(target.x, 0, target.z))
    };

    //---> Create 3D Scene



    this.createScene = () => {
      let { field } = this

      let playerTags = this.sessionTags.filter(x => x.playerId !== 0),
        ballTags = this.sessionTags.filter(x => x.playerId == 0);
      this.scene = new BABYLON.Scene(this.engine);

      this.generateLight();
      //--> Set Transparent Background
      this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

      //--> Create an Arc Rotate Camera
      this.camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, 1.0, this.initCameraZoom, new BABYLON.Vector3(0, 0, field.height / 2), this.scene);
      this.camera.attachControl(this.canvas, true, false);

      // This creates and positions a universal camera (non-mesh)
      // this.camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 40, -60), this.scene);
      //
      // // This targets the camera to scene origin
      // this.camera.setTarget(BABYLON.Vector3.zero());
      //
      // // This attaches the camera to the canvas
      // this.camera.attachControl(this.canvas, true);

      this.camera.upperBetaLimit = 1.5708;

      this.createPlayers(playerTags);
      this.createBalls(ballTags);
      this.generateShadows();

      //--> Create Axis
      // this.showAxis(5);

      switch(this.pitchType) {
        case 0:
          // PitchBuilder.createGround(this)
          this.createGround()
          break
        case 1:
          this.createNetballPitch()
          break
        case 2:
          // this.createRugbyXPitch()
          this.createGround()
          break
        case 3:
          this.createFootballPitch()
          break
        default:
          this.createGround()
          break
      }

      this.scene.autoClear = false; // Color buffer
      this.scene.autoClearDepthAndStencil = false; // Depth and stencil, obviously
    };

    //----> Live And Post Kick Controller for Broadcast


    this.checkForTagOnClick = (e, callback) => {
      const viewportOffset = this.mapCanvas.getBoundingClientRect();
      const x = e.pageX - viewportOffset.left,
        y = e.pageY - viewportOffset.top;

      let closestX
      let closestY
      let closestId
      for (var key in this.mapObjects) {
        let tag = this.mapObjects[key],
          { scaleX, scaleY } = this.getCanvasCoordinate(this.scale, tag.x, tag.y)

        this.drawCircle(x, y, this.coverCtx, 3, '#0099CC' , '#0099CC')
        if (scaleX - x < 20 && scaleX - x > -20 && scaleY - y < 20 && scaleY - y > -20) {

          if ((Math.abs(scaleX - x) < closestX && Math.abs(scaleY - y) < closestY) || !closestId) {
            closestX = Math.abs(scaleX - x)
            closestY = Math.abs(scaleY - y)
            closestId = key
          }
        }
      }
      callback(closestId)
    }

    this.setSelectedTag = (tagId) => {
      this.selectedTag = tagId
    }

    this.addPlayerEventListeners = (type, cb, cb2, cb3) => {

      //---> Add and remove players from the defensive line array
      // 3D Listener
      // this.scene.onPointerObservable.add((pointerInfo, eventState) => {
      //   const { pickedMesh, pickedPoint } = pointerInfo.pickInfo;
      //   if (pickedMesh) {
      //     if (pickedMesh.id.slice(0, 6) == "player") this.updateDefensiveLine(pickedMesh)
      //   }
      // }, BABYLON.PointerEventTypes.POINTERTAP, false);

      // 2D Listeners
      this.mapCanvas.removeEventListener('click', this.handleCanvasEventClick);
      this.canvasEventType = type;
      this.canvasEventCallback = cb;
      this.canvasEventCallbackTwo = cb2
      this.canvasEventCallbackThree = cb3
      this.mapCanvas.addEventListener('click', this.handleCanvasEventClick)
    }
    this.handleCanvasEventClick = (e) => {
      let { field } = this
      const {coverCtx, mapWidth, mapHeight } = this;
      const viewportOffset = this.mapCanvas.getBoundingClientRect();
      const x = e.pageX - viewportOffset.left,
        y = e.pageY - viewportOffset.top;
      coverCtx.setLineDash([0]);
      const top = this.getCanvasCoordinate(this.scale, null, mapHeight).scaleY,
        bottom = this.getCanvasCoordinate(this.scale, null, 0).scaleY,
        xRight = this.getCanvasCoordinate(this.scale, -(mapWidth / 2 + field.l1)).scaleX,
        xRightTry = this.getCanvasCoordinate(this.scale, -(mapWidth / 2), 0).scaleX,
        xLeft = this.getCanvasCoordinate(this.scale, (mapWidth / 2 + field.l1)).scaleX,
        xLeftTry = this.getCanvasCoordinate(this.scale, (mapWidth / 2), 0).scaleX

      if(x < xRightTry && x > xRight && y < bottom && y > top && this.canvasEventCallbackTwo) this.canvasEventCallbackTwo(-1)
      if(x < xLeft && x > xLeftTry && y < bottom && y > top && this.canvasEventCallbackThree) this.canvasEventCallbackThree(1)


      for (var key in this.mapObjects) {
        let player = this.mapObjects[key],
          { scaleX, scaleY } = this.getCanvasCoordinate(this.scale, player.x, player.y)
        if (scaleX - x < 5 && scaleX - x > -5 && scaleY - y < 5 && scaleY - y > -5) {
          if (player.ball && this.canvasEventCallbackTwo) {
            this.canvasEventCallback(key)
          }
          if (!player.ball) {
            this.canvasEventCallback(player.playerId, player.n, player.t);
          }
        }
      }
    }
    this.changeKickDirection = (direction)=>{
      if(direction === this.kickDirection) {
        this.kickDirection = 0
      } else {
        this.kickDirection = direction
      }
    }
    this.setInitialKickDirection = (direction = undefined)=>{
      this.kickDirection = direction
    }
    this.setInitialSelectedBalls = (ball)=>{
      this.selectedBalls = ball
    }
    this.updateSelectedBall = (ball) => {
      if(!ball) return this.selectedBalls = []
      if (this.selectedBalls.some(x => x === ball)) {
        this.selectedBalls = this.selectedBalls.filter(x => {
          return x !== ball;
        });
      } else {
        this.selectedBalls = [ball];
      }
    }
    this.drawLiveKickInfo = (info) => {
      const { coverCtx, poles } = this
      let { ballPosition, postPosition, distance, apparentWidth, angle } = info

      // clear 2D canvas before drawing
      this.clear2DCanvas()

      // convert angle to radians
      angle = angle * (Math.PI / 180)

      // draw line from ball to center of the poles
      drawLine(ballPosition.x, ballPosition.y, postPosition.x, postPosition.y, coverCtx, null, 2, "blue", this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale)

      //draw label
      this.drawTextBox(`${distance.toFixed(2)}m`, (ballPosition.x + postPosition.x) / 2, (ballPosition.y + postPosition.y) / 2, "15px Arial", "white", coverCtx)

      // draw apparent width line
      let closestPostPosition = {...postPosition}
      let otherPoint = {}
      if (postPosition.x < 0 && ballPosition.y > postPosition.y) {
        closestPostPosition.y = closestPostPosition.y + ( poles.width / 2 )
        otherPoint.x = closestPostPosition.x + (apparentWidth * Math.sin(angle))
        otherPoint.y = closestPostPosition.y - (apparentWidth * Math.cos(angle))
      } else if (postPosition.x > 0 && ballPosition.y > postPosition.y) {
        closestPostPosition.y = closestPostPosition.y + ( poles.width / 2 )
        otherPoint.x = closestPostPosition.x - (apparentWidth * Math.sin(angle))
        otherPoint.y = closestPostPosition.y - (apparentWidth * Math.cos(angle))
      } else if (postPosition.x < 0 && ballPosition.y < postPosition.y) {
        closestPostPosition.y = closestPostPosition.y - ( poles.width / 2 )
        otherPoint.x = closestPostPosition.x + (apparentWidth * Math.sin(angle))
        otherPoint.y = closestPostPosition.y + (apparentWidth * Math.cos(angle))
      } else if (postPosition.x > 0 && ballPosition.y < postPosition.y) {
        closestPostPosition.y = closestPostPosition.y - ( poles.width / 2 )
        otherPoint.x = closestPostPosition.x - (apparentWidth * Math.sin(angle))
        otherPoint.y = closestPostPosition.y + (apparentWidth * Math.cos(angle))
      }
      drawLine(closestPostPosition.x, closestPostPosition.y, otherPoint.x, otherPoint.y, coverCtx, null, 2, "red", this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale)
      // Draw label
      this.drawTextBox(`${apparentWidth.toFixed(2)}m`, (closestPostPosition.x + otherPoint.x) / 2, (closestPostPosition.y + otherPoint.y) / 2, "15px Arial", "white", coverCtx)
    }

    //---> Breakdown line

    this.lastGausPos = {};
    this.breakdownLineActive = false
    this.toggleBreakdownLine = () => {
      this.breakdownLineActive = !this.breakdownLineActive;
    }
    this.calculateBreakDownLine = (key, x, y) => {
      // Breakdown detection
      // If within the pitch boundaries
      const { gausMap, lastGausPos, field } = this;

      if ((x < field.tryLineDistance/2 && x > -field.tryLineDistance/2) && (y > 0 && y < field.height)) {

        const thdMinEventDetection = 4
        const thdMinPlayers = 4
        const thdMinTeams = 1
        const radiusOfCommitedPlayers = 4

        let max = 0
        let coords = {
          x: 0,
          y: 0
        }

        // Check to see if tag has been plotted on the Gausian
        if (lastGausPos[key]) {
          let oldX = lastGausPos[key].x
          let oldY = lastGausPos[key].y
          // Subtract old value

          changeGausMapValue(oldX, oldY, -1, this.gausMap, field)
        }
        // Get the players position in the gausMap
        let gausX = Math.floor(x + field.tryLineDistance/2)
        let gausY = Math.floor(y)

        changeGausMapValue(gausX, gausY, 1, this.gausMap, field)

        lastGausPos[key] = {
          x: gausX,
          y: gausY
        }
        for (let i = 0; i < field.tryLineDistance; i++) {
          for (let j = 0; j < field.height; j++) {
            let sum = 0
            if (gausMap[i][j] > 0) {
              sum += gausMap[i][j]
              for (let x = -1; x <= 1; x++) {
                if ( i+x < field.tryLineDistance && i+x >= 0){
                  for(let y = -1; y<=1; y++){
                    if(j+y < field.height && j+y >= 0){
                      sum += gausMap[i+x][j+y]
                    }
                  }
                }
              }
              if (sum > max) {
                max = sum
                coords = {
                  x: i,
                  y: j
                }
              }
            }
          }
        }
        let playerMap = {}

        // Check for min number of players in area
        if ((max/2.9464797401801706) > thdMinEventDetection) {
          for (let tId in PositionMap.map) {
            if (PositionMap.map[tId].x + field.tryLineDistance/2 > coords.x-radiusOfCommitedPlayers && PositionMap.map[tId].x + field.tryLineDistance/2 < coords.x+radiusOfCommitedPlayers) {
              if (PositionMap.map[tId].y > coords.y-radiusOfCommitedPlayers && PositionMap.map[tId].y < coords.y+radiusOfCommitedPlayers) {
                playerMap[tId] = PositionMap.map[tId]
              }
            }
          }


          // Check if min players involved
          if (Object.keys(playerMap).length > thdMinPlayers-1) {
            let teams = []
            for (let tId in playerMap) {
              for (let i = 0; i < this.sessionTags.length; i++) {
                if (this.sessionTags[i].tagId == tId) {
                  if (!teams.includes(this.sessionTags[i].teamId)) {
                    teams.push(this.sessionTags[i].teamId)
                  }
                }
              }
            }
            // Check if min teams involved
            if (teams.length > thdMinTeams-1) {
              let canvasCoord = this.getCanvasCoordinate(this.canvas2DPixelScale, coords.x-field.tryLineDistance/2, coords.y)
              let yBoundLower = this.getCanvasCoordinate(this.canvas2DPixelScale, 0, 0)
              let yBoundUpper = this.getCanvasCoordinate(this.canvas2DPixelScale, 0, field.height)
              return {
                canvasCoord,
                yBoundLower,
                yBoundUpper
              }
            }
          }
        }
      }
    }

    //---> Events

    this.events = {
      active: false,
      events: [],
      highlightedId: null,
      selected: {},
      kickColours: {}
    }

    this.setKicksColours = () => {
      this.sessionTags
        .filter(tag => tag.player)
        .forEach((tag, index) => {
          this.events.kickColours[tag.playerId] = tag.player.color
        })
    }

    this.appendTo2dCanvas = (canvas, className) => {
      this.canvasContainer2D.append(canvas)

      canvas.style.width = `${(this.mapWidth + this.mapOffsetX * 2) * this.scale}px`;
      canvas.style.height = `${(this.mapHeight + this.mapOffsetY * 2) * this.scale}px`;
      canvas.width = this.mapCanvas.width
      canvas.height = this.mapCanvas.height
      canvas.style.position = 'absolute';
      canvas.className = className
    }

    this.createCanvasElement = (className, id) => {
      let div = document.createElement('div')
      this.canvasContainer2D.append(div)
      div.className = `${className} canvasElement`
      return div
    }

    this.removeCanvases = (className) => {

      let canvasElements = document.getElementsByClassName(className)

      for (let i = canvasElements.length - 1; i >= 0; i--) {
        let element = canvasElements[i]
        element.remove()
      }
    }

    this.initiateEventsCanvas = (eventListenerCallback) => {
      this.events.active = true;
      if (this.mapCtx) this.clearMapFrame(this.mapCtx)
      this.events.canvas = document.createElement('canvas')
      this.events.eventHandleCanvas = document.createElement('canvas')

      this.appendTo2dCanvas(this.events.canvas, "eventsCanvas")
      this.appendTo2dCanvas(this.events.eventHandleCanvas, "eventsCanvas")

      this.events.eventHandleCanvas.style.zIndex = 2

      this.events.ctx = this.events.canvas.getContext("2d");

      // for (let key in this.playerMesh) {
      //   this.playerMesh[key].visibility = 0;
      // }
      // for (let key in this.players) {
      //   this.players[key].plane.visibility = 0
      // }
      // for (let key in this.balls) {
      //   this.balls[key].mesh.visibility = 0
      //   this.balls[key].mesh.customOutline.visibility = 0
      // }
      // if(this.ballMesh) this.ballMesh.visibility = 0

      // Add event listeners to events canvas

      eventListenerCallback()
    }
    this.plotEventsOnCanvas = (dataType, drawIgnored, validation) => {
      // 2D
      if (!dataType) dataType = 'data'
      this.drawKicks(dataType, drawIgnored, validation);
    }
    this.setSportscasterEvents = (sportsCasterEvents) => {
      this.events.events = sportsCasterEvents.map(x => {
        x.data = x.data.map(packet => {
          packet.pos = {
            x: packet.x,
            y: packet.y,
            z: packet.z
          }
          return packet
        })
        return x
      })
    }
    this.drawKicks = (dataType, drawIgnored, validation) => {
      const { ctx, events } = this.events;
      this.clearMapFrame(ctx);

      for (let i = 0; i < events.length; i++) {
        let event = events[i];



        let color = validation ? sportableColors.red : "black"

        if (validation) {
          if (event.success) color = sportableColors.brightgreen
        } else {
          if (event.id === this.events.highlightedId) {
            color = "yellow"
          } else if (this.events.kickColours[event.fromPlayerId]) {
            color = this.events.kickColours[event.fromPlayerId]
          }
        }


        if (event[dataType] && (!event.ignore || drawIgnored)) {
          ctx.beginPath()
          ctx.lineWidth = 3
          ctx.lineCap="round"
          ctx.strokeStyle = color
          let coord = this.getCanvasCoordinate(this.canvas2DPixelScale, event[dataType][0].pos.x + (event.offsetX ? event.offsetX : 0) + this.ealingOffset.x, event[dataType][0].pos.y + (event.offsety ? event.offsetY : 0) + this.ealingOffset.y)
          ctx.moveTo(coord.scaleX, coord.scaleY)
          let exitedPitch = false
          let exitPacket
          for (let j = 1; j < event[dataType].length; j++) {
            let packet = event[dataType][j]
            let coord = this.getCanvasCoordinate(this.canvas2DPixelScale, packet.pos.x + (event.offsetX ? event.offsetX : 0) + this.ealingOffset.x, packet.pos.y + (event.offsety ? event.offsetY : 0) + this.ealingOffset.y)
            ctx.lineTo(coord.scaleX, coord.scaleY)
            if (event.timeExitedPitch && packet.timestamp - event.startTime > event.timeExitedPitch && !exitedPitch) {
              exitedPitch = true
              exitPacket = packet
            }
          }
          ctx.stroke()

          if (exitPacket) {
            this.drawCircle(exitPacket.pos.x, exitPacket.pos.y, ctx, 4, 'black', 'yellow')
          }

          let lastPacket = event[dataType][event[dataType].length - 1]
          this.drawCircle(lastPacket.pos.x, lastPacket.pos.y, ctx, 4, color, 'white')
        }
      }
    }
    this.clear2DCanvas = () => {
      const { coverCtx } = this
      const { ctx } = this.events
      if (ctx) {
        this.clearMapFrame(ctx)
      }
      if (coverCtx) {
        this.clearMapFrame(coverCtx)
        this.drawRugbyLines('rgba(255,255,255,0.9)')
      }
    }
    this.highlightFlight = (flightId) => {
      if (this.canvasReady) {
        this.events.highlightedId = flightId
        this.drawKicks('data')
        // this.drawFlightCard(flightId)
      }
    }
    this.unhighlightFlight = () => {
      if (this.canvasReady) {
        this.events.highlightedId = null
        this.drawKicks('data')
        // this.hideFlightCard()
      }
    }
    this.hideFlightCard = () => {
      const { events } = this.events

      for (var i = 0; i < events.length; i++) {
        if (events[i].infoDiv) {
          events[i].infoDiv.remove()
          delete events[i].infoDiv
        }
      }
    }
    this.closestId = null
    this.eventsCanvasClickHandle = (e, stateUpdate) => {
      let { offsetX, offsetY } = e
      let { events } = this.events

      let closest = {}
      for (var i = 0; i < events.length; i++) {
        let event = events[i]
        if (event.data && !event.ignore) {
          let lastPoint = event.data[event.data.length - 1]
          let firstPoint = event.data[0]
          let scaledLastPoint = this.getCanvasCoordinate(this.scale, lastPoint.x, lastPoint.y)
          let scaledFirstPoint = this.getCanvasCoordinate(this.scale, firstPoint.x, firstPoint.y)
          if ((!(scaledFirstPoint.scaleX > offsetX && scaledLastPoint.scaleX > offsetX) || !(scaledFirstPoint.scaleX < offsetX && scaledLastPoint.scaleX < offsetX)) && (!(scaledFirstPoint.scaleY > offsetY && scaledLastPoint.scaleY > offsetY) || !(scaledFirstPoint.scaleY < offsetY && scaledLastPoint.scaleY < offsetY))) {
            for (var j = 0; j < event.data.length; j++) {
              let packet = event.data[j]
              let { scaleX, scaleY } = this.getCanvasCoordinate(this.scale, packet.x, packet.y)
              if (Math.abs(scaleX - offsetX) < 10 && Math.abs(scaleY - offsetY) < 10) {
                let dist = distance({x: scaleX, y: scaleY}, {x: offsetX, y: offsetY})
                if (closest.dist) {
                  if (dist < closest.dist) {
                    closest.flightId = event.id
                    closest.dist = dist
                  }
                } else {
                  closest.flightId = event.id
                  closest.dist = dist
                }
              }
            }
          }

        }
      }
      if (closest.flightId) {
        // Update react state if flight highlighted
        stateUpdate(closest.flightId)
      } else {
        stateUpdate(null)
      }
    }
    this.drawFlightCard = (flightId, players) => {
      this.hideFlightCard()

      const { events, ctx, canvas } = this.events;
      let flight = events.find(event => event.id === flightId)

      let playerTag = this.sessionTags.find(sessionTag => {
        return sessionTag.playerId === flight.fromPlayerId
      })

      let player

      if (playerTag) player = playerTag.player

      // if (!player.img) {
      //   player.img = playerAvatar
      // }

      if (flight.data) {
        flight.infoDiv = document.createElement("div")

        let flightStart = flight.data[0]
        let flightEnd = flight.data[flight.data.length - 1]
        let scaledFlightStart = this.getCanvasCoordinate(this.scale, flightStart.x, flightStart.y)
        let scaledFlightEnd = this.getCanvasCoordinate(this.scale, flightEnd.x, flightEnd.y)

        flight.infoDiv.classList.add("flightMarker")

        this.canvasContainer2D.append(flight.infoDiv);
        flight.infoDiv.style.top = `${scaledFlightStart.scaleY}px`
        flight.infoDiv.style.left = `${scaledFlightStart.scaleX}px`

        let html = `
        <div class="imageContainer">
          <img style="border: #000000 2px solid;" src="${playerAvatar}"></img>
        </div>
        <div class="info">
          <div class="names">
            <h5>No Player Found</h5>
          </div>
          <div class="stats">
            <div>
              <p>Distance</p>
              <h3>${flight.dist.toFixed(1)} m</h3>
            </div>
            <div>
              <p>Hangtime</p>
              <h3>${flight.hangTime.toFixed(1)} s</h3>
            </div>
          </div>
        </div>
        `

        if (player) {
          let kickColour = this.events.kickColours[player.id]
          html =  `
          <div class="imageContainer">
            <img style="border: ${kickColour} 2px solid;" src="${player.img || playerAvatar}"></img>
          </div>
          <div class="info">
            <div class="names">
              <h5>${player.firstName} ${player.lastName}</h5>
            </div>
            <div class="stats">
              <div>
                <p>Distance</p>
                <h3>${flight.dist.toFixed(1)} m</h3>
              </div>
              <div>
                <p>Hangtime</p>
                <h3>${flight.hangTime.toFixed(1)} s</h3>
              </div>
            </div>
          </div>
          `
        }

        flight.infoDiv.innerHTML =
          `<div id="container-fl" class="container">
          <div id="arrow-fl" class="flightArrow"></div>
          <div id="cardcontainer-fl" class="flightCardContainer">
            <div id="card-fl" class="flightCard">
              ${html}
            </div>
          </div>
        </div>`

        let container = document.getElementById('container-fl')
        let arrow = document.getElementById('arrow-fl')
        let cardcontainer = document.getElementById('cardcontainer-fl')
        let card = document.getElementById('card-fl')

        let animateUpRight = () => {
          container.style.transform = 'translateY(-100%)'
          arrow.style.left = 0
          arrow.style.bottom = 0
          cardcontainer.style.left = 0
          cardcontainer.style.top = 0
          card.style.left = '-100%'
        }

        let animateDownRight = () => {
          container.style.transform = 'translateY(0%)'
          arrow.style.left = 0
          arrow.style.top = 0
          cardcontainer.style.left = 0
          cardcontainer.style.top = '66.6%'
          card.style.left = '-100%'
        }
        let animateUpLeft = () => {
          container.style.transform = 'translateY(-50%) translateX(-100%)'
          arrow.style.right = 0
          cardcontainer.style.left = 0
          cardcontainer.style.top = 0
          card.style.left = '100%'
        }

        let animateDownLeft = () => {
          container.style.transform = 'translateY(-50%) translateX(-100%)'
          arrow.style.right = 0
          arrow.style.top = '50%'
          cardcontainer.style.left = 0
          cardcontainer.style.top = '66.6%'
          card.style.left = '100%'
        }

        let containerHeight = parseInt(window.getComputedStyle(container).height)

        // Base card animation on start location on y axis
        if (flightStart.y > this.field.height / 2) {
          if (!this.pitchFlipped) {
            animateDownRight()
          } else {
            animateUpRight()
          }
        } else {
          if (!this.pitchFlipped) {
            animateUpRight()
          } else {
            animateDownRight()
          }
        }

        // Base card animation on start and end location

        // if (scaledFlightStart.scaleY < scaledFlightEnd.scaleY) {
        //   if (scaledFlightStart.scaleY < containerHeight / 2) {
        //     animateDownRight()
        //   } else {
        //     animateUpRight()
        //   }
        // } else if (scaledFlightStart.scaleY > scaledFlightEnd.scaleY) {
        //   if (parseInt(canvas.style.height) - scaledFlightStart.scaleY < containerHeight / 2) {
        //     animateUpRight()
        //   } else {
        //     animateDownRight()
        //   }
        // }

        animations.arrowGrow(arrow, () => {
          animations.slideCardIn(card)
        })
      }

    }


    /* Render / remove kicks from canvas */

    this.kickTubes = [];
    this.renderKicks = (id, dataType) => {
      if (this.babylonActive) {
        if (!dataType) dataType = 'data'
        // clear kicks before rendering
        this.clearKicks();

        const { events } = this.events;
        var kicksMaterial = new BABYLON.StandardMaterial("kicksMaterial", this.scene);
        var successKickMaterial = new BABYLON.StandardMaterial("kicksMaterial", this.scene);
        var selectedMaterial = new BABYLON.StandardMaterial("selectedMaterial", this.scene);
        var outerMaterial = new BABYLON.StandardMaterial("selectedMaterial", this.scene);

        kicksMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        successKickMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        selectedMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0);
        outerMaterial.alpha = 0;
        // myMaterial.specularColor = new BABYLON.Color3(0.5, 0.6, 0.87);
        // myMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
        // myMaterial.ambientColor = new BABYLON.Color3(0.23, 0.98, 0.53);

        function isRawCondition(packet, event) {
          if (dataType === 'data') {
            return true
          } else {
            return packet.timestamp > event.startTime && packet.timestamp < event.endTime
          }
        }

        if (events) {
          for (let j = 0; j < events.length; j++) {
            let path = [];
            if (events[j][dataType]) {
              let event = events[j]
              let lastPacket
              let exitedPitch = false
              let exitPacket
              for (let i = 0; i < event[dataType].length; i++) {
                let packet = event[dataType][i];
                if (i === events[j][dataType].length - 1) lastPacket = packet
                if (packet.pos.x !== 0 && packet.pos.y !== 0) {
                  if (isRawCondition(packet, events[j])) {
                    let v3 = new BABYLON.Vector3(packet.pos.x  + this.ealingOffset.x, packet.pos.z, packet.pos.y + this.ealingOffset.y);
                    path.push(v3);
                    v3 = null
                  }
                }

                // Check If exited pitch
                if (event.timeExitedPitch && packet.timestamp - event.startTime > event.timeExitedPitch && !exitedPitch) {
                  exitedPitch = true
                  exitPacket = packet
                }
              }

              //Draw circle for final packet

              if (path.length > 1) {
                let tube = {
                  innerTube: BABYLON.MeshBuilder.CreateTube(`tube`, {path: path, radius: 0.1, sideOrientation: BABYLON.Mesh.FRONTSIDE, tessellation: 4, updatable: true}, this.scene)
                }

                if (lastPacket) {
                  tube.endSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.75}, this.scene)
                  tube.endSphere.material = events[j].success ? successKickMaterial : kicksMaterial
                  tube.endSphere.position.x = lastPacket.pos.x
                  tube.endSphere.position.y = lastPacket.pos.z
                  tube.endSphere.position.z = lastPacket.pos.y
                }

                if (exitPacket) {
                  tube.exitSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.75}, this.scene)
                  tube.exitSphere.material = selectedMaterial
                  tube.exitSphere.position.x = exitPacket.pos.x
                  tube.exitSphere.position.y = exitPacket.pos.z
                  tube.exitSphere.position.z = exitPacket.pos.y
                }

                // tube.outerTube.material = outerMaterial

                if (events[j].id == this.events.highlightedId) {
                  tube.innerTube.material = selectedMaterial
                } else {
                  tube.innerTube.material = events[j].success ? successKickMaterial : kicksMaterial
                }
                this.kickTubes.push(tube)
                for (var i = 0; i < path.length; i++) {
                  path[i] = null
                }
                path = []

                // if (!isNaN(events[j].offsetX)) tube.innerTube.translate(BABYLON.Axis.x, events[j].offsetX, BABYLON.Space.WORLD)
                // if (!isNaN(events[j].offsetY)) tube.innerTube.translate(BABYLON.Axis.z, events[j].offsetY, BABYLON.Space.WORLD)
                // if (!isNaN(events[j].offsetZ)) tube.innerTube.translate(BABYLON.Axis.y, events[j].offsetZ, BABYLON.Space.WORLD)
              }
            }
          }
        }
      }
    }
    this.clearKicks = () => {
      for (let i = 0; i < this.kickTubes.length; i++) {
        this.scene.removeMesh(this.kickTubes[i].innerTube, true)
        this.scene.removeMesh(this.kickTubes[i].endSphere, true)
        if (this.kickTubes[i].exitSphere) this.scene.removeMesh(this.kickTubes[i].exitSphere, true)

        // this.scene.removeMesh(this.kickTubes[i].outerTube, true)
        this.kickTubes[i].innerTube.dispose();
        this.kickTubes[i].endSphere.dispose();
        if (this.kickTubes[i].exitSphere) this.kickTubes[i].exitSphere.dispose();
        // this.kickTubes[i].outerTube.dispose();
        this.kickTubes[i].innerTube = null;
        this.kickTubes[i].endSphere = null;
        if (this.kickTubes[i].exitSphere) this.kickTubes[i].exitSphere = null;
        // this.kickTubes[i].outerTube = null;
      }
      this.kickTubes = [];
    }

    //--> Areas of Access

    this.toggleAreasofAccess = (cb) => {
      let { field } = this

      this.areasOfAccessActive = !this.areasOfAccessActive;

      if (this.areasOfAccessActive) {

        this.clearMapFrame(this.coverCtx);
        this.coverCanvas.style.background = 'white';
        // Draw pitch lines based on type
        switch(this.pitchType) {
          case 0:
            this.drawRugbyLines('black')
            break
          case 1:
            this.drawNetballLines('black')
            break
          case 2:
            this.drawRugbyXLines('black')
            break
          case 3:
            this.drawNFLLines('black')
            break
          default:
            this.drawRugbyLines('black')
            break
        }

      } else {

        this.clearMapFrame(this.coverCtx);
        this.coverCanvas.style.background = field.color;
        // Draw pitch lines based on type
        switch(this.pitchType) {
          case 0:
            this.drawRugbyLines('rgba(255,255,255,0.9)')
            break
          case 1:
            this.drawNetballLines('white')
            break
          case 2:
            this.drawRugbyXLines('white')
            break
          case 3:
            this.drawNFLLines('rgba(255,255,255,0.9)')
            break
          default:
            this.drawRugbyLines('rgba(255,255,255,0.9)')
            break
        }
      }
      if (cb) cb();
    }

    //---> Trails

    this.trails = {
      active: true,
      players: {}
    }
    this.updatePlayerTrails = (tag, playerId, team, number) => {
      if (this.trails.active) {
        let { players } = this.trails;
        if (players[tag]) {
          this.trails.players[tag].canvas.parentNode.removeChild(this.trails.players[tag].canvas)
          delete this.trails.players[tag];
        } else {
          this.trails.players[tag] = {tag, number, id: playerId, team}
          this.addTrailCanvas(tag);
        }
      }
    }
    this.addTrailCanvas = (tag) => {
      this.trails.players[tag].canvas = document.createElement('canvas');
      this.canvasContainer2D.append(this.trails.players[tag].canvas);
      this.trails.players[tag].canvas.style.width = `${(this.mapWidth + this.mapOffsetX * 2) * this.scale}px`
      this.trails.players[tag].canvas.style.height = `${(this.mapHeight + this.mapOffsetY * 2) * this.scale}px`
      this.trails.players[tag].canvas.width = this.mapCanvas.width
      this.trails.players[tag].canvas.height = this.mapCanvas.height
      this.trails.players[tag].canvas.style.position = 'absolute';
      this.trails.players[tag].ctx = this.trails.players[tag].canvas.getContext("2d");
      this.trails.players[tag].canvas.className = "trailCanvas";
    }
    this.clearPlayerTrails = (team) => {
      for (let key in this.trails.players) {
        let player = this.trails.players[key];
        if (player.team == team) {
          player.canvas.parentNode.removeChild(player.canvas)
          delete this.trails.players[key];
        }
      }
    }

    //---> Player Speed

    this.calculatePlayerSpeed = (tagId) => {
      if (this.mapObjects[tagId]) {
        const { vel } = this.mapObjects[tagId];
        let playerSpeed = speed(vel.x, vel.y);
        if (playerSpeed < 0.5) return 0;
        return playerSpeed;
      }
      return 0;
    }

    //--> Defensive Lines

    // TODO: Defensive lines deactivated as not working. Fix before implementing. (Not required for wallaby)
    this.defensiveLines = {
      active: false,
      A: {
        players: [],
        active: true
      },
      B: {
        players: [],
        active: true
      }
    };
    // Prepopulate defensive lines if settings have been applied
    if (playbackSettings.defensiveLines) {
      this.defensiveLines["A"] = {players: playbackSettings.defensiveLines["A"] || [], active: true}
      this.defensiveLines["B"] = {players: playbackSettings.defensiveLines["B"] || [], active: true}
    }
    this.updateDefensiveLine = (player, playerId, team, number) => {
      if (this.defensiveLines.active) {
        let { players } = this.defensiveLines[team];
        if (players.some(x => x.player == player)) {
          this.defensiveLines[team].players = players.filter(x => {
            return x.player !== player;
          });
        } else {
          players.push({player, number, id: playerId});
        }
      }
    }
    this.drawDefensiveLines = (team) => {
      const players = this.defensiveLines[team].players;
      let color = "blue"
      if (team == "B") color = "blue"
      if (players.length > 1) {
        // 1. sort array of players in the defensive line base on y position;
        // 2. reduce array of players drawing a tube between each;
        let filteredArr = players
          .filter((a) => {
            return a.position
          })
          .sort((a, b) => {
            return a.position.y - b.position.y
          });


        if (filteredArr.length > 0) {
          filteredArr.reduce((a, b, i) => {
            drawLine(a.position.x, a.position.y, b.position.x, b.position.y, this.mapCtx, null, 2, "black", this.getCanvasCoordinate, this.canvas2DPixelScale, this.scale);
            this.mapCtx.beginPath();
            this.mapCtx.moveTo(a.position.x, a.position.y);
            this.mapCtx.lineTo(b.position.x, b.position.y);
            this.mapCtx.lineWidth = 3;
            this.mapCtx.strokeStyle = color;
            this.mapCtx.stroke();
            return b;
          })
        }
      }
    }
    this.calculateLineSpeed = (team) => {
      if (this.defensiveLines[team].players.length > 1) {
        let totalXSpeed = this.defensiveLines[team].players.reduce((a, b) => {
            if (b.vel) return a + b.vel.x;
            return 0;
          }, 0),
          averageXSpeed = totalXSpeed / this.defensiveLines[team].players.length;
        return Math.abs(averageXSpeed);
      } else {
        return 0
      }

    }
    this.calculateDefenceUniformity = (team) => {
      let {players} = this.defensiveLines[team]

      if (players.length > 1) {
        let maxDi, totDiY, uniformity;
        let sumDi = 0;
        let filteredArr = players
          .filter((a) => {
            return a.position
          })
          .sort((a,b) => {
            if (a.position.y < b.position.y) {
              return -1;
            }
            if (a.position.y > b.position.y) {
              return 1;
            }
            return 0;
          })
        maxDi = 0;

        if (filteredArr.length > 0) {

          for (var i = 0; i < filteredArr.length; i++) {

            if (i>0) {
              let diffX = filteredArr[i].position.x - filteredArr[i-1].position.x
              let diffY = filteredArr[i].position.y - filteredArr[i-1].position.y
              let absDiff = Math.sqrt(diffX*diffX + diffY*diffY)

              sumDi += absDiff
              if (absDiff > maxDi) {
                maxDi = absDiff
              }
            }
          }

          totDiY = filteredArr[filteredArr.length -1].position.y - filteredArr[0].position.y

          let spacingCheck = Math.max(0, (1 - (maxDi/totDiY)) * ((filteredArr.length-1)/(filteredArr.length-2)))
          let deviationCheck = totDiY/sumDi

          uniformity = spacingCheck*deviationCheck
          // uniformity = 0.5*spacingCheck + 0.5*deviationCheck
          return uniformity
        } else {
          return 0
        }

      } else {
        return 0
      }
    }
    this.toggleDefensiveLines = () => {
      this.defensiveLines.active = !this.defensiveLines.active
    }
    this.toggleDefensiveLine = (team) => {
      this.defensiveLines[team].active = !this.defensiveLines[team].active;
    }
    this.clearDefensiveLine = (team) => {
      this.defensiveLines[team].players = [];
    }

    //--> Let there be light!!

    this.generateLight = () => {

      // Light
      // this.light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 50, 0), this.scene);
      // this.light1.intensity = 0.8;

      // --> Let there be light
      var light1 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(-1, 320, 1), this.scene);
      this.light1 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-1, -2, 1), this.scene);
      this.light1.shadowOrthoScale = 0.1;
      this.light1.intensity = 4;

      // this.light1 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -2, 0), this.scene);
      // this.light1.intensity = 4;
      //
      // this.light2 = new BABYLON.DirectionalLight("dir02", new BABYLON.Vector3(0, 2, 0), this.scene);
      // this.light2.intensity = 4;
      //
      // this.light3 = new BABYLON.DirectionalLight("dir03", new BABYLON.Vector3(-2, 0, 0), this.scene);
      // this.light3.intensity = 4;
      //
      // this.light4 = new BABYLON.DirectionalLight("dir04", new BABYLON.Vector3(2, 0, 0), this.scene);
      // this.light4.intensity = 4;
      //
      // this.light5 = new BABYLON.DirectionalLight("dir05", new BABYLON.Vector3(0, 0, -2), this.scene);
      // this.light5.intensity = 4;
      //
      // this.light6 = new BABYLON.DirectionalLight("dir06", new BABYLON.Vector3(0, 0, 2), this.scene);
      // this.light6.intensity = 4;

    }

    //--> 3D Ground

    this.createFootballPitch = () => {

      let { poles } = this
      //--> create goals

      const yardInMeters = 0.9144;

      var pole1 = BABYLON.Mesh.CreateCylinder("cyl1", 3.33 * yardInMeters, poles.diameter, poles.diameter, 24, this.scene);
      pole1.position = {
        x: -60 * yardInMeters,
        y: 1.66 * yardInMeters,
        z: 26.66 * yardInMeters
      }
      var pole2 = BABYLON.Mesh.CreateCylinder("cyl1", 6.16 * yardInMeters, poles.diameter, poles.diameter, 24, this.scene);
      pole2.position = {
        x: -60 * yardInMeters,
        y: 3.33 * yardInMeters,
        z: 26.66 * yardInMeters
      }
      pole2.rotation.x = Math.PI / 2;
      var pole3 = BABYLON.Mesh.CreateCylinder("cyl1", 6.66 * yardInMeters, poles.diameter, poles.diameter, 24, this.scene);
      pole3.position = {
        x: -60 * yardInMeters,
        y: 6.66 * yardInMeters,
        z: 23.58 * yardInMeters
      }
      var pole4 = BABYLON.Mesh.CreateCylinder("cyl1", 6.66 * yardInMeters, poles.diameter, poles.diameter, 24, this.scene);
      pole4.position = {
        x: -60 * yardInMeters,
        y: 6.66 * yardInMeters,
        z: 29.74 * yardInMeters
      }

      var pole5 = BABYLON.Mesh.CreateCylinder("cyl1", 3.33 * yardInMeters, poles.diameter, poles.diameter, 24, this.scene);
      pole5.position = {
        x: 60 * yardInMeters,
        y: 1.66 * yardInMeters,
        z: 26.66 * yardInMeters
      }
      var pole6 = BABYLON.Mesh.CreateCylinder("cyl1", 6.16 * yardInMeters, poles.diameter, poles.diameter, 24, this.scene);
      pole6.position = {
        x: 60 * yardInMeters,
        y: 3.33 * yardInMeters,
        z: 26.66 * yardInMeters
      }
      pole6.rotation.x = Math.PI / 2;
      var pole7 = BABYLON.Mesh.CreateCylinder("cyl1", 6.66 * yardInMeters, poles.diameter, poles.diameter, 24, this.scene);
      pole7.position = {
        x: 60 * yardInMeters,
        y: 6.66 * yardInMeters,
        z: 23.58 * yardInMeters
      }
      var pole8 = BABYLON.Mesh.CreateCylinder("cyl1", 6.66 * yardInMeters, poles.diameter, poles.diameter, 24, this.scene);
      pole8.position = {
        x: 60 * yardInMeters,
        y: 6.66 * yardInMeters,
        z: 29.74 * yardInMeters
      }

      var groundL1 = BABYLON.Mesh.CreateGround("ground", 125.32 * yardInMeters, 58.66 * yardInMeters, 1, this.scene);
      groundL1.position.x = 0
      groundL1.position.z = 53.33 / 2 * yardInMeters
      groundL1.position.y = 0
      groundL1.receiveShadows = true
      var groundL1Material = new BABYLON.StandardMaterial("textureGround", this.scene)
      groundL1Material.specularColor = new BABYLON.Color3(0, 0, 0)
      groundL1Material.diffuseTexture = new BABYLON.Texture(footballPitchImg, this.scene)
      groundL1.material = groundL1Material


      //--> Create Vertical Edges around ground
      //=============================p====================================

      var ground1 = BABYLON.Mesh.CreateGround("ground1", 58.66 * yardInMeters, 1, 1, this.scene);

      ground1.position.x = -62.66 * yardInMeters;
      ground1.position.z = 53.33 / 2 * yardInMeters;
      ground1.position.y = -0.5;
      ground1.rotation.x = -Math.PI / 2;
      ground1.rotation.y = -Math.PI / 2;
      ground1.rotation.z = -Math.PI;

      var groundMaterial1 = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundMaterial1.specularColor = new BABYLON.Color3(0, 0, 0);
      groundMaterial1.emissiveColor = new BABYLON.Color3(1, 1, 1);
      groundMaterial1.diffuseTexture = new BABYLON.Texture(nflTxImg, this.scene);
      ground1.material = groundMaterial1;

      var ground2 = BABYLON.Mesh.CreateGround("ground2", 58.66 * yardInMeters, 1, 1, this.scene);

      ground2.position.x = 62.66 * yardInMeters;
      ground2.position.z = 53.33 / 2 * yardInMeters;
      ground2.position.y = -0.5;
      ground2.rotation.x = -Math.PI / 2;
      ground2.rotation.y = -Math.PI / 2;

      ground2.material = groundMaterial1;

      var ground3 = BABYLON.Mesh.CreateGround("ground3", 125.32 * yardInMeters, 1, 1, this.scene);

      ground3.position.x = 0;
      ground3.position.z = -2.66 * yardInMeters;
      ground3.position.y = -0.5;
      ground3.rotation.x = -Math.PI / 2;

      var groundMaterial3 = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundMaterial3.specularColor = new BABYLON.Color3(0, 0, 0);
      groundMaterial3.emissiveColor = new BABYLON.Color3(1, 1, 1);
      groundMaterial3.diffuseTexture = new BABYLON.Texture(nflTxImg, this.scene);
      ground3.material = groundMaterial3;

      var ground4 = BABYLON.Mesh.CreateGround("ground4", 125.32 * yardInMeters, 1, 1, this.scene);

      ground4.position.x = 0;
      ground4.position.z = (58.66 - 2.66) * yardInMeters;
      ground4.position.y = -0.5;
      ground4.rotation.x = -Math.PI / 2;
      ground4.rotation.y = Math.PI;

      ground4.material = groundMaterial3;
    }
    this.createRugbyXPitch = () => {

    }
    this.createNetballPitch = () => {
      let { field, poles } = this
      //--> create goals
      var pole1 = BABYLON.Mesh.CreateCylinder("cyl1", poles.height, poles.diameter, poles.diameter, 16, this.scene);
      pole1.position = {
        x: -(field.l2 * 1.5),
        y: poles.height / 2,
        z: (field.height / 2)
      };
      var pole2 = BABYLON.Mesh.CreateCylinder("cyl2", poles.height, poles.diameter, poles.diameter, 16, this.scene);
      pole2.position = {
        x: field.l9 * 1.5,
        y: poles.height / 2,
        z: (field.height / 2)
      };

      var hoop1 = BABYLON.MeshBuilder.CreateTorus("hoop1", {thickness: 0.02, diameter: poles.hoopDiameter, tessellation: 32}, this.scene);
      hoop1.position = {
        x: field.l9 * 1.5 - (poles.hoopDiameter / 2),
        y: poles.height,
        z: (field.height / 2)
      };

      var hoop2 = BABYLON.MeshBuilder.CreateTorus("hoop2", {thickness: 0.02, diameter: poles.hoopDiameter, tessellation: 32}, this.scene);
      hoop2.position = {
        x: -(field.l2 * 1.5) + (poles.hoopDiameter / 2),
        y: poles.height,
        z: (field.height / 2)
      };

      var groundL1 = BABYLON.Mesh.CreateGround("ground", field.l2, field.height, 1, this.scene);
      groundL1.position.x = -field.l2
      groundL1.position.z = field.height / 2
      groundL1.position.y = 0
      groundL1.receiveShadows = true
      var groundL1Material = new BABYLON.StandardMaterial("textureGround", this.scene)
      groundL1Material.specularColor = new BABYLON.Color3(0, 0, 0)
      groundL1Material.diffuseTexture = new BABYLON.Texture(netballL1Img, this.scene)
      groundL1.material = groundL1Material

      var groundL2 = BABYLON.Mesh.CreateGround("ground", field.l5 + field.l6, field.height, 1, this.scene);
      groundL2.position.x = 0;
      groundL2.position.z = field.height / 2;
      groundL2.position.y = 0;
      groundL2.receiveShadows = true;
      var groundL2Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL2Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL2Material.diffuseTexture = new BABYLON.Texture(netballL2Img, this.scene);
      groundL2.material = groundL2Material;

      var groundL3 = BABYLON.Mesh.CreateGround("ground", field.l9, field.height, 1, this.scene);
      groundL3.position.x = field.l9;
      groundL3.position.z = field.height / 2;
      groundL3.position.y = 0;
      groundL3.receiveShadows = true;
      var groundL3Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL3Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL3Material.diffuseTexture = new BABYLON.Texture(netballL3Img, this.scene);
      groundL3.material = groundL3Material;

      var groundEdge1 = BABYLON.Mesh.CreateGround("ground", field.width + (field.edges * 2), field.edges, 1, this.scene);
      groundEdge1.position.x = 0;
      groundEdge1.position.z = -field.edges / 2;
      groundEdge1.position.y = 0;
      groundEdge1.receiveShadows = true;
      var groundEdge1Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundEdge1Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundEdge1Material.diffuseTexture = new BABYLON.Texture(netballTileImg2, this.scene);
      groundEdge1Material.diffuseTexture.uScale = 10.0;
      groundEdge1.material = groundEdge1Material;

      var groundEdge2 = BABYLON.Mesh.CreateGround("ground", field.width + (field.edges * 2), field.edges, 1, this.scene);
      groundEdge2.position.x = 0;
      groundEdge2.position.z = field.height + field.edges / 2;
      groundEdge2.position.y = 0;
      groundEdge2.receiveShadows = true;
      groundEdge2.material = groundEdge1Material;

      var groundEdge3 = BABYLON.Mesh.CreateGround("ground", field.edges, field.height, 1, this.scene);
      groundEdge3.position.x = -(field.l2 * 1.5) - (field.edges / 2)
      groundEdge3.position.z = (field.height / 2);
      groundEdge3.position.y = 0;
      groundEdge3.receiveShadows = true;
      var groundEdge3Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundEdge3Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundEdge3Material.diffuseTexture = new BABYLON.Texture(netballTileImg2, this.scene);
      groundEdge3Material.diffuseTexture.vScale = 10.0;
      groundEdge3.material = groundEdge3Material;

      var groundEdge4 = BABYLON.Mesh.CreateGround("ground", field.edges, field.height, 1, this.scene);
      groundEdge4.position.x = (field.l2 * 1.5) + (field.edges / 2)
      groundEdge4.position.z = (field.height / 2);
      groundEdge4.position.y = 0;
      groundEdge4.receiveShadows = true;
      groundEdge4.material = groundEdge3Material;

      //--> Create Vertical Edges around ground
      //=============================p====================================

      var ground1 = BABYLON.Mesh.CreateGround("ground1", field.height + (field.edges * 2), 1, 1, this.scene);

      ground1.position.x = -(field.width / 2) - field.edges;
      ground1.position.z = field.height / 2;
      ground1.position.y = -0.5;
      ground1.rotation.x = -Math.PI / 2;
      ground1.rotation.y = -Math.PI / 2;
      ground1.rotation.z = -Math.PI;

      var groundMaterial1 = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundMaterial1.specularColor = new BABYLON.Color3(0, 0, 0);
      groundMaterial1.emissiveColor = new BABYLON.Color3(1, 1, 1);
      groundMaterial1.diffuseTexture = new BABYLON.Texture(netballTileImg2, this.scene);
      ground1.material = groundMaterial1;

      var ground2 = BABYLON.Mesh.CreateGround("ground2", field.height + (field.edges * 2), 1, 1, this.scene);

      ground2.position.x = (field.width / 2) + field.edges;
      ground2.position.z = field.height / 2;
      ground2.position.y = -0.5;
      ground2.rotation.x = -Math.PI / 2;
      ground2.rotation.y = -Math.PI / 2;

      ground2.material = groundMaterial1;

      var ground3 = BABYLON.Mesh.CreateGround("ground3", field.width + (field.edges * 2), 1, 1, this.scene);

      ground3.position.x = 0;
      ground3.position.z = -field.edges;
      ground3.position.y = -0.5;
      ground3.rotation.x = -Math.PI / 2;

      var groundMaterial3 = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundMaterial3.specularColor = new BABYLON.Color3(0, 0, 0);
      groundMaterial3.emissiveColor = new BABYLON.Color3(1, 1, 1);
      groundMaterial3.diffuseTexture = new BABYLON.Texture(netballTileImg2, this.scene);
      ground3.material = groundMaterial3;

      var ground4 = BABYLON.Mesh.CreateGround("ground4", field.width + (field.edges * 2), 1, 1, this.scene);

      ground4.position.x = 0;
      ground4.position.z = field.height + field.edges;
      ground4.position.y = -0.5;
      ground4.rotation.x = -Math.PI / 2;
      ground4.rotation.y = Math.PI;

      ground4.material = groundMaterial3;
    }
    this.createGround = () => {
      let { field, poles, dimensions } = this
      //--> Poles
      var pole1 = BABYLON.MeshBuilder.CreateCylinder("cylinder", {height: poles.height, diameter: poles.diameter}, this.scene);
      pole1.position.x = dimensions.P31.x
      pole1.position.y = poles.height / 2
      pole1.position.z = dimensions.P31.y

      var pole2 = BABYLON.MeshBuilder.CreateCylinder("cyl2", {height: poles.height, diameter: poles.diameter}, this.scene);
      pole2.position.x = dimensions.P33.x
      pole2.position.y = poles.height / 2
      pole2.position.z = dimensions.P33.y

      var pole3 = BABYLON.MeshBuilder.CreateCylinder("cyl3", {height: poles.width, diameter: poles.diameter}, this.scene);
      pole3.position.x = dimensions.P31.x
      pole3.position.y = dimensions.P31.z
      pole3.position.z = dimensions.P31.y + (dimensions.P33.y - dimensions.P31.y) / 2
      pole3.rotation.x = Math.PI / 2;

      var pole4 = BABYLON.MeshBuilder.CreateCylinder("cyl4", {height: poles.height, diameter: poles.diameter}, this.scene);
      pole4.position.x = dimensions.P35.x
      pole4.position.y = poles.height / 2
      pole4.position.z = dimensions.P35.y

      var pole5 = BABYLON.MeshBuilder.CreateCylinder("cyl5", {height: poles.height, diameter: poles.diameter}, this.scene);
      pole5.position.x = dimensions.P37.x
      pole5.position.y = poles.height / 2
      pole5.position.z = dimensions.P37.y

      var pole6 = BABYLON.MeshBuilder.CreateCylinder("cyl6", {height: poles.width, diameter: poles.diameter}, this.scene);
      pole6.position.x = dimensions.P37.x
      pole6.position.y = dimensions.P37.z
      pole6.position.z = dimensions.P37.y + (dimensions.P35.y - dimensions.P37.y) / 2
      pole6.rotation.x = Math.PI / 2;

      /* Pitch */

      var groundL1 = BABYLON.Mesh.CreateGround("ground", field.l1, field.height, 1, this.scene);
      groundL1.position.x = -(field.l1 / 2) - field.l2 - field.l3 - field.l4 - field.l5;
      groundL1.position.z = field.height / 2;
      groundL1.position.y = 0;
      groundL1.receiveShadows = true;
      var groundL1Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL1Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL1Material.diffuseTexture = new BABYLON.Texture(l1Img, this.scene);
      groundL1.material = groundL1Material;

      var groundL2 = BABYLON.Mesh.CreateGround("ground", field.l2 + field.l3, field.height, 1, this.scene);
      groundL2.position.x = -((field.l2 + field.l3) / 2) - field.l4 - field.l5;
      groundL2.position.z = field.height / 2;
      groundL2.position.y = 0;
      groundL2.receiveShadows = true;
      var groundL2Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL2Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL2Material.diffuseTexture = new BABYLON.Texture(l2Img, this.scene);
      groundL2.material = groundL2Material;

      var groundL3 = BABYLON.Mesh.CreateGround("ground", field.l4, field.height, 1, this.scene);
      groundL3.position.x = -(field.l4 / 2) - field.l5;
      groundL3.position.z = field.height / 2;
      groundL3.position.y = 0;
      groundL3.receiveShadows = true;
      var groundL3Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL3Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL3Material.diffuseTexture = new BABYLON.Texture(l3Img, this.scene);
      groundL3.material = groundL3Material;

      var groundL4 = BABYLON.Mesh.CreateGround("ground", field.l5, field.height, 1, this.scene);
      groundL4.position.x = -field.l5 / 2;
      groundL4.position.z = field.height / 2;
      groundL4.position.y = 0;
      groundL4.receiveShadows = true;
      var groundL4Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL4Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL4Material.diffuseTexture = new BABYLON.Texture(l4Img, this.scene);
      groundL4.material = groundL4Material;

      var groundL5 = BABYLON.Mesh.CreateGround("ground", field.l6, field.height, 1, this.scene);
      groundL5.position.x = field.l6 / 2;
      groundL5.position.z = field.height / 2;
      groundL5.position.y = 0;
      groundL5.receiveShadows = true;
      var groundL5Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL5Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL5Material.diffuseTexture = new BABYLON.Texture(l5Img, this.scene);
      groundL5.material = groundL5Material;

      var groundL6 = BABYLON.Mesh.CreateGround("ground", field.l7, field.height, 1, this.scene);
      groundL6.position.x = (field.l7 / 2) + field.l6;
      groundL6.position.z = field.height / 2;
      groundL6.position.y = 0;
      groundL6.receiveShadows = true;
      var groundL6Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL6Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL6Material.diffuseTexture = new BABYLON.Texture(l6Img, this.scene);
      groundL6.material = groundL6Material;

      var groundL7 = BABYLON.Mesh.CreateGround("ground", field.l8 + field.l9, field.height, 1, this.scene);
      groundL7.position.x = ((field.l8 + field.l9) / 2) + field.l7 + field.l6;
      groundL7.position.z = field.height / 2;
      groundL7.position.y = 0;
      groundL7.receiveShadows = true;
      var groundL7Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL7Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL7Material.diffuseTexture = new BABYLON.Texture(l7Img, this.scene);
      groundL7.material = groundL7Material;

      var groundL8 = BABYLON.Mesh.CreateGround("ground", field.l10, field.height, 1, this.scene);
      groundL8.position.x = (field.l10 / 2) + field.l6 + field.l7 + field.l8 + field.l9;
      groundL8.position.z = field.height / 2;
      groundL8.position.y = 0;
      groundL8.receiveShadows = true;
      var groundL8Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundL8Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundL8Material.diffuseTexture = new BABYLON.Texture(l8Img, this.scene);
      groundL8.material = groundL8Material;

      var groundEdge1 = BABYLON.Mesh.CreateGround("ground", field.width + (field.edges * 2), field.edges, 1, this.scene);
      groundEdge1.position.x = 0;
      groundEdge1.position.z = -field.edges / 2;
      groundEdge1.position.y = 0;
      groundEdge1.receiveShadows = true;
      var groundEdge1Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundEdge1Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundEdge1Material.diffuseTexture = new BABYLON.Texture(fieldTileImg, this.scene);
      groundEdge1Material.diffuseTexture.uScale = 10.0;
      groundEdge1.material = groundEdge1Material;

      var groundEdge2 = BABYLON.Mesh.CreateGround("ground", field.width + (field.edges * 2), field.edges, 1, this.scene);
      groundEdge2.position.x = 0;
      groundEdge2.position.z = field.height + field.edges / 2;
      groundEdge2.position.y = 0;
      groundEdge2.receiveShadows = true;
      groundEdge2.material = groundEdge1Material;

      var groundEdge3 = BABYLON.Mesh.CreateGround("ground", field.edges, field.height, 1, this.scene);
      groundEdge3.position.x = -(field.l1 + field.l2 + field.l3 + field.l4 + field.l5) - (field.edges / 2);
      groundEdge3.position.z = (field.height / 2);
      groundEdge3.position.y = 0;
      groundEdge3.receiveShadows = true;
      var groundEdge3Material = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundEdge3Material.specularColor = new BABYLON.Color3(0, 0, 0);
      groundEdge3Material.diffuseTexture = new BABYLON.Texture(fieldTileImg, this.scene);
      groundEdge3Material.diffuseTexture.vScale = 10.0;
      groundEdge3.material = groundEdge3Material;

      var groundEdge4 = BABYLON.Mesh.CreateGround("ground", field.edges, field.height, 1, this.scene);
      groundEdge4.position.x = (field.l1 + field.l2 + field.l3 + field.l4 + field.l5) + (field.edges / 2);
      groundEdge4.position.z = (field.height / 2);
      groundEdge4.position.y = 0;
      groundEdge4.receiveShadows = true;
      groundEdge4.material = groundEdge3Material;

      //--> Create Vertical Edges around ground
      //=============================p====================================

      var ground1 = BABYLON.Mesh.CreateGround("ground1", field.height + (field.edges * 2), 3.5, 1, this.scene);

      ground1.position.x = -(field.width / 2) - field.edges;
      ground1.position.z = field.height / 2;
      ground1.position.y = -1.75;
      ground1.rotation.x = -Math.PI / 2;
      ground1.rotation.y = -Math.PI / 2;
      ground1.rotation.z = -Math.PI;

      var groundMaterial1 = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundMaterial1.specularColor = new BABYLON.Color3(0, 0, 0);
      groundMaterial1.emissiveColor = new BABYLON.Color3(1, 1, 1);
      groundMaterial1.diffuseTexture = new BABYLON.Texture(fieldWidthImg, this.scene);
      ground1.material = groundMaterial1;

      var ground2 = BABYLON.Mesh.CreateGround("ground2", field.height + (field.edges * 2), 3.5, 1, this.scene);

      ground2.position.x = (field.width / 2) + field.edges;
      ground2.position.z = field.height / 2;
      ground2.position.y = -1.75;
      ground2.rotation.x = -Math.PI / 2;
      ground2.rotation.y = -Math.PI / 2;

      ground2.material = groundMaterial1;

      var ground3 = BABYLON.Mesh.CreateGround("ground3", field.width + (field.edges * 2), 3.5, 1, this.scene);

      ground3.position.x = 0;
      ground3.position.z = -field.edges;
      ground3.position.y = -1.75;
      ground3.rotation.x = -Math.PI / 2;

      var groundMaterial3 = new BABYLON.StandardMaterial("textureGround", this.scene);
      groundMaterial3.specularColor = new BABYLON.Color3(0, 0, 0);
      groundMaterial3.emissiveColor = new BABYLON.Color3(1, 1, 1);
      groundMaterial3.diffuseTexture = new BABYLON.Texture(fieldLengthImg, this.scene);
      ground3.material = groundMaterial3;

      var ground4 = BABYLON.Mesh.CreateGround("ground4", field.width + (field.edges * 2), 3.5, 1, this.scene);

      ground4.position.x = 0;
      ground4.position.z = field.height + field.edges;
      ground4.position.y = -1.75;
      ground4.rotation.x = -Math.PI / 2;
      ground4.rotation.y = Math.PI;

      ground4.material = groundMaterial3;

      // Generate sideboards
      //
      // for (let j = -((field.width / 2 + field.edges) / 10); j <= ((field.width / 2 + field.edges) / 10); j++) {
      //
      //   let path1 = []
      //   let path2 = []
      //   let lastBoard  = false
      //   for (let i = 0; i <= 10; i++) {
      //     if (i + (j * 10) <= field.width / 2 + field.edges) {
      //       let path1Vector = new BABYLON.Vector3(i + (j * 10), 2, field.height + field.edges + 1)
      //       let path2Vector = new BABYLON.Vector3(i + (j * 10), 0, field.height + field.edges)
      //       path1.push(path1Vector)
      //       path2.push(path2Vector)
      //     } else {
      //       lastBoard = true
      //     }
      //   }
      //
      //   let path3 = []
      //   let path4 = []
      //
      //   for (let i = 0; i <= 10 && i + (j * 10) <= field.width / 2 + field.edges; i++) {
      //     let path1Vector = new BABYLON.Vector3(i + (j * 10), 2, field.height + field.edges + 1)
      //     let path2Vector = new BABYLON.Vector3(i + (j * 10), 0, field.height + field.edges + 1)
      //     path3.push(path1Vector)
      //     path4.push(path2Vector)
      //   }
      //
      //   //Create ribbon with updatable parameter set to true for later changes
      //   var sideboard1 = BABYLON.MeshBuilder.CreateRibbon("ribbon", {pathArray: [path1, path2], sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true}, this.scene);
      //   var sideboard2 = BABYLON.MeshBuilder.CreateRibbon("ribbon", {pathArray: [path3, path4], sideOrientation: BABYLON.Mesh.DOUBLESIDE, updatable: true}, this.scene);
      //
      //   var sideboardMaterial = new BABYLON.StandardMaterial("textureGround", this.scene);
      //   sideboardMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
      //   sideboardMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
      //   if (!lastBoard) {
      //     sideboardMaterial.diffuseTexture = new BABYLON.Texture(sideboardImg, this.scene);
      //     sideboardMaterial.diffuseTexture.uScale = 1
      //     sideboardMaterial.diffuseTexture.vScale = -1
      //   } else {
      //     sideboardMaterial.diffuseTexture = new BABYLON.Texture(blackRec, this.scene);
      //   }
      //   sideboard1.material = sideboardMaterial;
      // }
    };

    //--> 3D Balls

    this.createBalls = (ballTags) => {
      let { field } = this

      //--> Create + Position Balls

      var black = new BABYLON.StandardMaterial('black', this.scene);
      black.emissiveColor = new BABYLON.Color3(0, 0, 0);
      black.diffuseColor = new BABYLON.Color3(0, 0, 0);
      black.specularColor = new BABYLON.Color3(0, 0, 0);

      var materialSphereBall = new BABYLON.StandardMaterial("texture1", this.scene);
      materialSphereBall.diffuseColor = new BABYLON.Color3(1, 1, 1);
      materialSphereBall.emissiveColor = new BABYLON.Color3(0.6, 0.6, 0);
      for (let i = 0; i < ballTags.length; i++) {
        this.ballMesh = BABYLON.Mesh.CreateSphere("ball" + i, 10.0, this.ballSphereDiameter, this.scene);
        this.ballMesh.customOutline = BABYLON.Mesh.CreateSphere("outline" + i, 10, this.ballSphereDiameter + this.ballOutlineWidth, this.scene, false, BABYLON.Mesh.BACKSIDE)
        this.ballMesh.customOutline.parent = this.ballMesh
        this.ballMesh.customOutline.material = black
        this.ballMesh.material = materialSphereBall
        let ballTag = ballTags[i];
        let ballObj = {
          mesh: this.ballMesh,
          number: 0,
          teamId: null,
          team: null,
          ball: true,
        }
        ballObj.mesh.position.x = -(field.width / 2) + (10 * (i - 23))
        ballObj.mesh.position.z = -10

        this.balls[ballTag.tagId] = ballObj
      }
    }

    //--> 3D Players

    this.createPlayers = (playerTags) => {
      //--> Team Materials
      var materialSphereTeamA = new BABYLON.StandardMaterial("texture1", this.scene);
      materialSphereTeamA.diffuseColor = new BABYLON.Color3(1.0, 0.2, 0.7);

      var materialSphereTeamB = new BABYLON.StandardMaterial("texture1", this.scene);
      materialSphereTeamB.diffuseColor = new BABYLON.Color3(0.2, 0.7, 1.0);

      this.playerMesh = {
        A: BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: this.playerSphereDiameter, segments: 32}, this.scene),
        B: BABYLON.MeshBuilder.CreateSphere("playerB", {diameter: this.playerSphereDiameter}, this.scene)
      }
      this.playerMesh.A.convertToUnIndexedMesh();
      this.playerMesh.A.material = materialSphereTeamA;
      this.playerMesh.A.setEnabled(false)

      this.playerMesh.B.convertToUnIndexedMesh();
      this.playerMesh.B.material = materialSphereTeamB;
      this.playerMesh.B.setEnabled(false)

      this.playerPlane = BABYLON.Mesh.CreatePlane("playerPlane", 1.2, this.scene, false);
      this.playerPlane.convertToUnIndexedMesh();
      this.playerPlane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
      this.playerPlane.setEnabled(false)

      for (var i = 0; i < playerTags.length; i++) {
        const playerTag = playerTags[i]

        if (!playerTag.player) playerTag.player = {}

        let team = "A";
        if (playerTag.teamId == this.teams.B.id) {
          team = "B";
        }

        let playerObj = {
          mesh: this.playerMesh[team].createInstance(`player${team}${i + 1}`),
          plane: this.playerPlane.clone(`playerPlane${team}${i + 1}`),
          planeTexture: new BABYLON.DynamicTexture(`playerPlaneTexture${team}${i + 1}`, 512, this.scene, true),
          number: playerTag.player.playerNumber,
          teamId: playerTag.teamId,
          playerId: playerTag.player.playerId,
          team,
          ball: false
        }

        playerObj.plane.position.x = 200
        playerObj.mesh.position.x = 200

        this.players[playerTag.tagId] = playerObj
      }

      //--> Position and add material to players
      const { playersXpos, playersSpacing } = this;

      for (let tagId in this.players) {
        let player = this.players[tagId];

        player.plane.material = new BABYLON.StandardMaterial(`playerPlane${player.team}-${tagId}`, this.scene);
        player.plane.material.diffuseTexture = player.planeTexture;
        player.plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
        player.plane.material.emissiveColor = new BABYLON.Color3(1, 1, 1);
        player.plane.material.backFaceCulling = false;
        player.planeTexture.drawText(player.number, null, 360, "bold 312px verdana", "#4E4E4E", "#FFFFFF");
      }

    }

    //--> Shadows

    this.generateShadows = () => {
      //--> Shadows
      // var shadowGenerator = new BABYLON.ShadowGenerator(1024, this.light1);
      // for (var tagId in this.players) {
      //   if (this.players.hasOwnProperty(tagId)) {
      //     shadowGenerator.getShadowMap().renderList.push(this.players[tagId].mesh);
      //   }
      // }
      // shadowGenerator.useBlurVarianceShadowMap = true;
    }

    //--> Axis

    this.showAxis = (size) => {
      var makeTextPlane = (text, color, size) => {
        var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, this.scene, true);
        dynamicTexture.hasAlpha = true;
        dynamicTexture.drawText(text, 5, 40, "bold 48px Arial", color, "transparent", true);
        var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, this.scene, true);
        plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", this.scene);
        plane.material.backFaceCulling = false;
        plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
        plane.material.diffuseTexture = dynamicTexture;
        return plane;
      };

      var axisX = BABYLON.Mesh.CreateLines("axisX", [
        new BABYLON.Vector3.zero(),
        new BABYLON.Vector3(size, 0, 0),
        new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
        new BABYLON.Vector3(size, 0, 0),
        new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
      ], this.scene);
      axisX.color = new BABYLON.Color3(1, 0, 0);

      var xChar = makeTextPlane("X", "red", size / 10);
      xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);

      var axisY = BABYLON.Mesh.CreateLines("axisY", [
        new BABYLON.Vector3.zero(),
        new BABYLON.Vector3(0, size, 0),
        new BABYLON.Vector3(-0.05 * size, size * 0.95, 0),
        new BABYLON.Vector3(0, size, 0),
        new BABYLON.Vector3(0.05 * size, size * 0.95, 0)
      ], this.scene);
      axisY.color = new BABYLON.Color3(0, 1, 0);

      var yChar = makeTextPlane("Z", "green", size / 10);
      yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);

      var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
        new BABYLON.Vector3.zero(),
        new BABYLON.Vector3(0, 0, size),
        new BABYLON.Vector3(0, -0.05 * size, size * 0.95),
        new BABYLON.Vector3(0, 0, size),
        new BABYLON.Vector3(0, 0.05 * size, size * 0.95)
      ], this.scene);
      axisZ.color = new BABYLON.Color3(0, 0, 1);
      var zChar = makeTextPlane("Y", "blue", size / 10);
      zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
    };

    this.interpolate = (v1, v2, t1, t2, t3) => {
      return v1 + ((t3 - t1) * (v2 - v1) / (t2 - t1));
    }

    this.drawDefenceLines = (positionMap) => {
      let lineMap = {};
      let playerArr = [];
      let globalMse = 0;
      const numberOfPlayersLimit = 4

      for (let k in positionMap) {
        if (!lineMap.hasOwnProperty(k)) {
          lineMap[k] = {};
        }
        let x = positionMap[k].x;
        let deltaXThres = 2
        let mse = 0;

        for (let ke in positionMap) {
          if (this.mapObjects.hasOwnProperty(k) && this.mapObjects.hasOwnProperty(ke)) {
            if (k !== ke && this.mapObjects[k].t == this.mapObjects[ke].t) {
              if (positionMap[ke].x > x-deltaXThres && positionMap[ke].x < x+deltaXThres) {
                lineMap[k][ke] = positionMap[ke]
              }
            }
          }

        }

        let len = Object.keys(lineMap[k]).length;
        if (len > numberOfPlayersLimit-1) {

          for (let ke in lineMap[k]) {
            mse = mse + ((x-lineMap[k][ke].x)*(x-lineMap[k][ke].x))
          }
          mse /= len;
          if (globalMse == 0) {
            globalMse = mse
          } else if (mse < globalMse) {
            globalMse = mse
            playerArr = []
            playerArr.push(k)
            for (let key in lineMap[k]) {
              playerArr.push(key)
            }
          }
        }


      }
      if (playerArr.length > 0) {
        playerArr.sort((a,b) => {
          if (this.mapObjects[a].y < this.mapObjects[b].y) {
            return -1;
          }
          if (this.mapObjects[a].y > this.mapObjects[b].y) {
            return 1;
          }
          return 0;
        })
      }

      for (var i = 0; i < playerArr.length-1; i++) {
        // let ctx2 = this.mapCanvas.getContext("2d");

        this.mapCtx.beginPath();
        this.mapCtx.moveTo(this.mapObjects[playerArr[i]].x,this.mapObjects[playerArr[i]].y);
        this.mapCtx.lineTo(this.mapObjects[playerArr[i+1]].x,this.mapObjects[playerArr[i+1]].y);
        this.mapCtx.lineWidth = 6;
        this.mapCtx.strokeStyle = 'rgba(0,255,0,1)';
        this.mapCtx.stroke();
      }
    }
  }
}

function create2DArray(numRows, numColumns) {
  let array = new Array(numRows);

  for(let i = 0; i < numRows; i++) {
    array[i] = new Array(numColumns);
    array[i].fill(0)
  }

  return array;
}

function changeGausMapValue(oldX, oldY, incDec, gausMap, field) {
  for (let x = -2; x <= 2; x++) {
    if ( oldX+x < field.tryLineDistance && oldX+x >= 0){
      for(let y = -2; y<=2; y++){
        if(oldY+y < field.height && oldY+y >= 0){
          let value;
          switch(Math.abs(x)+Math.abs(y)) {
            case 0:
              value = 1
              break;
            case 1:
              value = 0.716531
              break;
            case 2:
              value = 0.513417
              break;
            case 3 && x == 0:
              value = 0.188876
              break;
            case 3 && Math.abs(x) == 1:
              value = 0.263597
              break;
            case 4:
              value = 0.0694835
              break;
            default:
              value = 0
          }
          gausMap[oldX+x][oldY+y] += incDec*value
        }
      }
    }
  }
}
