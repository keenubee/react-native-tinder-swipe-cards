/* Gratefully copied from https://github.com/brentvatne/react-native-animated-demo-tinder */
'use strict';

import React, { Component } from 'react';

import {
  StyleSheet,
  Text,
  View,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';

import clamp from 'clamp';

import Defaults from './Defaults';

const viewport = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  card: {
    zIndex: 1000,
    borderWidth: 5,
    borderColor: 'rgba(2,119,184,1)',
    borderRadius: 25
  },
  cardWrapper: {
    zIndex: 999,
    position: 'absolute',
    top:0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgWrapper: {
    width: viewport.width / 1.63,
    height: viewport.width / 1.63,
    backgroundColor: 'white',
    borderRadius: 25,
  },
  yup: {
    zIndex: 888,
    borderWidth: 0,
    borderRadius: 600,
    position: 'absolute',
    bottom: viewport.height / 5.9,
    padding: 10,
    right: viewport.width / 17,
    width: viewport.width / 1.63,
    height: viewport.width / 1.63,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  yupText: {
    fontSize: 16,
    color: 'white'
  },
  maybe: {
    zIndex: 888,
    borderWidth: 0,
    borderRadius: 600,
    position: 'absolute',
    bottom: viewport.height / 9.5,
    padding: 15,
    left: (viewport.width - viewport.width / 1.63) / 2,
    width: viewport.width / 1.63,
    height: viewport.width / 1.63,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(192,211,226,1)',
    borderColor: 'rgba(192,211,226,1)'
  },
  maybeText: {
    fontSize: 16,
    color: 'white'
  },
  nope: {
    zIndex: 888,
    borderWidth: 0,
    borderRadius: 600,
    position: 'absolute',
    bottom: viewport.height / 5.9,
    padding: 15,
    left: viewport.width / 17,
    width: viewport.width / 1.63,
    height: viewport.width / 1.63,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  nopeText: {
    fontFamily: 'Avenir-Heavy',
    fontSize: 14,
    color: 'white'
  }
});

//Components could be unloaded and loaded and we will loose the users currentIndex, we can persist it here.
let currentIndex = {};
let guid = 0;

export default class SwipeCards extends Component {

  static propTypes = {
    cards: React.PropTypes.array,
    cardKey: React.PropTypes.string,
    hasMaybeAction: React.PropTypes.bool,
    loop: React.PropTypes.bool,
    onLoop: React.PropTypes.func,
    allowGestureTermination: React.PropTypes.bool,
    stack: React.PropTypes.bool,
    stackGuid: React.PropTypes.string,
    stackDepth: React.PropTypes.number,
    stackOffsetX: React.PropTypes.number,
    stackOffsetY: React.PropTypes.number,
    renderNoMoreCards: React.PropTypes.func,
    showYup: React.PropTypes.bool,
    showMaybe: React.PropTypes.bool,
    showNope: React.PropTypes.bool,
    handleYup: React.PropTypes.func,
    handleMaybe: React.PropTypes.func,
    handleNope: React.PropTypes.func,
    yupText: React.PropTypes.string,
    yupView: React.PropTypes.element,
    maybeText: React.PropTypes.string,
    maybeView: React.PropTypes.element,
    noText: React.PropTypes.string,
    noView: React.PropTypes.element,
    onClickHandler: React.PropTypes.func,
    renderCard: React.PropTypes.func,
    cardRemoved: React.PropTypes.func,
    dragY: React.PropTypes.bool,
    smoothTransition: React.PropTypes.bool,
    rotation: React.PropTypes.bool
  };

  static defaultProps = {
    cards: [],
    cardKey: 'key',
    hasMaybeAction: false,
    loop: false,
    onLoop: () => null,
    allowGestureTermination: true,
    stack: false,
    stackDepth: 5,
    stackOffsetX: 25,
    stackOffsetY: 0,
    showYup: true,
    showMaybe: true,
    showNope: true,
    handleYup: (card) => null,
    handleMaybe: (card) => null,
    handleNope: (card) => null,
    nopeText: "NO",
    maybeText: "ASK LATER",
    yupText: "YES",
    onClickHandler: () => { alert('tap'); },
    onDragStart: () => {},
    onDragRelease: () => {},
    cardRemoved: (ix) => null,
    renderCard: (card) => null,
    style: styles.container,
    dragY: true,
    smoothTransition: false,
    rotation: false
  };

  constructor(props) {
    super(props);

    //Use a persistent variable to track currentIndex instead of a local one.
    this.guid = this.props.guid || guid++;
    if (!currentIndex[this.guid]) currentIndex[this.guid] = 0;
    this.state = {
      pan: new Animated.ValueXY(0),
      enter: new Animated.Value(0.5),
      cards: [].concat(this.props.cards),
      card: this.props.cards[currentIndex[this.guid]]
    };

    this.lastX = 0;
    this.lastY = 0;

    this.cardAnimation = null;

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: (e, gestureState) => {
        this.props.onDragStart();
        this.lastX = gestureState.moveX;
        this.lastY = gestureState.moveY;
        return true;
      },
      onMoveShouldSetPanResponderCapture: (e, gestureState) => {
        if (Math.abs(gestureState.dx) < Math.abs(gestureState.dy)) return false;
        if ((gestureState.dx === 0) && (gestureState.dy === 0))   return false;
        return (Math.abs(this.lastX - gestureState.moveX) > 5 || Math.abs(this.lastY - gestureState.moveY) > 5);
      },

      onPanResponderGrant: (e, gestureState) => {
        this.state.pan.setOffset({ x: this.state.pan.x._value, y: this.state.pan.y._value });
        this.state.pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderTerminationRequest: (evt, gestureState) => this.props.allowGestureTermination,

      onPanResponderMove: Animated.event([
        null, { dx: this.state.pan.x, dy: this.props.dragY ? this.state.pan.y : 0 }
      ]),

      onPanResponderRelease: (e, {vx, vy, dx, dy}) => {
        this.props.onDragRelease();
        this.state.pan.flattenOffset();
        let velocity;
        if (Math.abs(dx) <= 5 && Math.abs(dy) <= 5)   //meaning the gesture did not cover any distance
        {
          this.canMove = true;
          this._forceNoSwipe();
          return;
          //this.props.onClickHandler(this.state.card);
        }

        if (vx > 0) {
          velocity = clamp(vx, 3, 5);
        } else if (vx < 0) {
          velocity = clamp(vx * -1, 3, 5) * -1;
        } else {
          velocity = dx < 0 ? -3 : 3;
        }

        const hasSwipedHorizontally = Math.abs(this.state.pan.x._value) > SWIPE_THRESHOLD;
        const hasSwipedVertically = Math.abs(this.state.pan.y._value) > SWIPE_THRESHOLD;
        if (hasSwipedHorizontally || (hasSwipedVertically && this.props.hasMaybeAction)) {

          let cancelled = false;
          let animation = null;

          const hasMovedRight = hasSwipedHorizontally && this.state.pan.x._value > 0;
          const hasMovedLeft = hasSwipedHorizontally && this.state.pan.x._value < 0;
          const hasMovedUp = hasSwipedVertically && this.state.pan.y._value > 0;
          if (hasMovedRight) {
            //animation = this._forceYesSwipe;
            cancelled = this.props.handleYup(this.state.card);
          } else if (hasMovedLeft) {
            //animation = this._forceNoSwipe;
            cancelled = this.props.handleNope(this.state.card);
          } else if (hasMovedUp && this.props.hasMaybeAction) {
            //animation = this._forceLaterSwipe;
            cancelled = this.props.handleMaybe(this.state.card);
          } else {
            cancelled = true;
          }

          //Yup or nope was cancelled, return the card to normal.
          if (cancelled) {
            this._resetPan();
            return;
          }

          //animation();

          this.props.cardRemoved(currentIndex[this.guid]);

          if (this.props.smoothTransition) {
            this._advanceState();
          } else {
            this.cardAnimation = Animated.decay(this.state.pan, {
              velocity: { x: velocity, y: vy },
              deceleration: 0.98
            });
            this.cardAnimation.start(status => {
              if (status.finished) this._advanceState();
              else this._resetState();

              this.cardAnimation = null;
            });
          }

        } else {
          this._resetPan();
        }
      }
    });
  }

  onLayout = (e) => {
    this.setState({
      ansSize: e.nativeEvent.layout.width,
      ansBottom: e.nativeEvent.layout.height/2 - viewport.width / 1.63 / 2
    });
  }

  _forceYesSwipe = () => {
    this.cardAnimation = Animated.decay(this.state.pan, {
      velocity: { x: 5, y: 5 },
      deceleration: 0.98
    }).start(status => {
      if (status.finished) this._advanceState();
      else this._resetState();

      this.cardAnimation = null;
    });
  }

  _forceNoSwipe = () => {
    this.cardAnimation = Animated.decay(this.state.pan, {
      velocity: { x: -5, y: 5 },
      deceleration: 0.98
    }).start(status => {
      if (status.finished) this._advanceState();
      else this._resetState();

      this.cardAnimation = null;
    });
  }

  _forceLaterSwipe = () => {
    this.cardAnimation = Animated.decay(this.state.pan, {
      velocity: { x: 0, y: 5 },
      deceleration: 0.98
    }).start(status => {
      if (status.finished) this._advanceState();
      else this._resetState();

      this.cardAnimation = null;
    });
  }

  _goToNextCard() {
    currentIndex[this.guid]++;

    // Checks to see if last card.
    // If props.loop=true, will start again from the first card.
    if (currentIndex[this.guid] > this.state.cards.length - 1 && this.props.loop) {
      this.props.onLoop();
      currentIndex[this.guid] = 0;
    }

    this.setState({
      card: this.state.cards[currentIndex[this.guid]]
    });
  }

  _goToPrevCard() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(0);
    this._animateEntrance();

    currentIndex[this.guid]--;

    if (currentIndex[this.guid] < 0) {
      currentIndex[this.guid] = 0;
    }

    this.setState({
      card: this.state.cards[currentIndex[this.guid]]
    });
  }

  componentDidMount() {
    this._animateEntrance();
  }

  _animateEntrance() {
    Animated.spring(
      this.state.enter,
      { toValue: 1, friction: 8 }
    ).start();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.cards !== this.props.cards) {

      if (this.cardAnimation) {
        this.cardAnimation.stop();
        this.cardAnimation = null;
      }

      currentIndex[this.guid] = 0;
      this.setState({
        cards: [].concat(nextProps.cards),
        card: nextProps.cards[0]
      });
    }
  }

  _resetPan() {
    Animated.spring(this.state.pan, {
      toValue: { x: 0, y: 0 },
      friction: 4
    }).start();
  }

  _resetState() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(0);
    this._animateEntrance();
  }

  _advanceState() {
    this.state.pan.setValue({ x: 0, y: 0 });
    this.state.enter.setValue(0);
    this._animateEntrance();
    this._goToNextCard();
  }

  /**
   * Returns current card object
   */
  getCurrentCard() {
    return this.state.cards[currentIndex[this.guid]];
  }

  renderNoMoreCards() {
    if (this.props.renderNoMoreCards) {
      return this.props.renderNoMoreCards();
    }

    return <Defaults.NoMoreCards />;
  }

  /**
   * Renders the cards as a stack with props.stackDepth cards deep.
   */
  renderStack() {
    if (!this.state.card) {
      return this.renderNoMoreCards();
    }

    //Get the next stack of cards to render.
    let cards = this.state.cards.slice(currentIndex[this.guid], currentIndex[this.guid] + this.props.stackDepth).reverse();

    return cards.map((card, i) => {

      let offsetX = this.props.stackOffsetX * cards.length - i * this.props.stackOffsetX;
      let lastOffsetX = offsetX + this.props.stackOffsetX;

      let offsetY = this.props.stackOffsetY * cards.length + i * this.props.stackOffsetY;
      let lastOffsetY = offsetY + this.props.stackOffsetY;

      let opacity = 0.25 + (0.75 / cards.length) * (i + 1);
      let lastOpacity = 0.25 + (0.75 / cards.length) * i;

      let scale = 0.75 + (0.25 / cards.length) * (i + 1);
      let lastScale = 0.75 + (0.25 / cards.length) * i;

      let style = {
        position: 'absolute',
        top: this.state.enter.interpolate({ inputRange: [0, 1], outputRange: [lastOffsetY, offsetY] }),
        left: this.state.enter.interpolate({ inputRange: [0, 1], outputRange: [lastOffsetX, offsetX] }),
        opacity: this.props.smoothTransition ? 1 : this.state.enter.interpolate({ inputRange: [0, 1], outputRange: [lastOpacity, opacity] }),
        transform: [{ scale: this.state.enter.interpolate({ inputRange: [0, 1], outputRange: [lastScale, scale] }) }],
        elevation: i * 10
      };

      //Is this the top card?  If so animate it and hook up the pan handlers.
      if (i + 1 === cards.length) {
        let {pan} = this.state;
        let [translateX, translateY] = [pan.x, pan.y];

        let rotate = this.props.rotation ? pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ["-30deg", "0deg", "30deg"] }) : "0deg";
        let opacity = this.props.smoothTransition ? 1 : pan.x.interpolate({ inputRange: [-120, 0, 120], outputRange: [0.25, 1, 0.25] });

        let animatedCardStyles = {
          ...style,
          transform: [
            { translateX: translateX },
            { translateY: translateY },
            { rotate: rotate },
            { scale: this.state.enter.interpolate({ inputRange: [0, 1], outputRange: [lastScale, scale] }) }
          ]
        };

        return (<Animated.View key={card[this.props.cardKey]} style={[styles.card, animatedCardStyles]} {... this._panResponder.panHandlers}>
          {this.props.renderCard(this.state.card)}
        </Animated.View>);
      }

      return <Animated.View key={card[this.props.cardKey]} style={style}>{this.props.renderCard(card)}</Animated.View>;
    });
  }

  renderCard() {
    if (!this.state.card) {
      return this.renderNoMoreCards();
    }

    let {pan, enter} = this.state;
    let [translateX, translateY] = [pan.x, pan.y];

    let rotate = this.props.rotation ? pan.x.interpolate({ inputRange: [-200, 0, 200], outputRange: ["-30deg", "0deg", "30deg"] }) : "0deg";
    let opacity = pan.x.interpolate({ inputRange: [-120, 0, 120], outputRange: [0.25, 1, 0.25] });
    let color = pan.x.interpolate({
      inputRange: [-SWIPE_THRESHOLD, -(SWIPE_THRESHOLD/2), (SWIPE_THRESHOLD/2), SWIPE_THRESHOLD],
      outputRange: ['rgba(255,147,82,1)', 'rgba(2,119,184,1)', 'rgba(2,119,184,1)', 'rgba(78,204,189,1)'],
      extrapolate: 'clamp'
    });


    let scale = enter;

    // if (!this.canMove) {
    //   translateX = 0;
    //   translateY = 0;
    //   opacity = 1;
    // }

    let animatedCardStyles = { borderColor: color, transform: [{ translateX }, { translateY }, { rotate }, { scale }], opacity };
    return (
      <Animated.View onLayout={this.onCardLayout} key={"top"} style={[styles.card, animatedCardStyles]} {... this._panResponder.panHandlers}>
        {this.props.renderCard(this.state.card)}
      </Animated.View>
    );
  }

  renderNope() {
    let {pan} = this.state;

    let nopeColor = pan.x.interpolate({
      inputRange: [-SWIPE_THRESHOLD, -(SWIPE_THRESHOLD/2)],
      outputRange: ['rgba(255,147,82,1)', 'rgba(2,119,184,1)'],
      extrapolate: 'clamp'
    });
    let animatedNopeStyles = { backgroundColor: nopeColor, borderColor: nopeColor };

    if (this.props.renderNope) {
      return this.props.renderNope(pan);
    }

    if (this.props.showNope) {

      const inner = this.props.noView
        ? this.props.noView
        : <Text style={styles.nopeText}>{this.props.nopeText}</Text>;

      return (<Animated.View pointerEvents={'none'} style={[styles.nope, animatedNopeStyles, {bottom: this.state.ansBottom}]}>
        {inner}
      </Animated.View>);
    }

    return null;
  }

  renderMaybe() {
    if (!this.props.hasMaybeAction) return null;

    if (this.props.showMaybe) {
      return (
        <View pointerEvents={'none'} style={[styles.maybe, {bottom: this.state.ansBottom - 45}]}>
          <Text style={styles.maybeText}>{this.props.maybeText}</Text>
        </View>
      );
    }

    return null;
  }

  renderYup() {
    let {pan} = this.state;

    let yupColor = pan.x.interpolate({
      inputRange: [(SWIPE_THRESHOLD/2), SWIPE_THRESHOLD],
      outputRange: ['rgba(2,119,184,1)', 'rgba(78,204,189,1)'],
      extrapolate: 'clamp'
    });
    let animatedYupStyles = { backgroundColor: yupColor, borderColor: yupColor };

    if (this.props.renderYup) {
      return this.props.renderYup(pan);
    }

    if (this.props.showYup) {

      const inner = this.props.yupView
        ? this.props.yupView
        : <Text style={styles.yupText}>{this.props.yupText}</Text>;

      return (
        <Animated.View pointerEvents={'none'} style={[styles.yup, animatedYupStyles, {bottom: this.state.ansBottom}]}>
          {inner}
        </Animated.View>
      );
    }

    return null;
  }

  render() {
    return (
      <View onLayout={this.onLayout} style={styles.container}>
        {this.renderNope()}
        {this.renderMaybe()}
        {this.renderYup()}
        <View style={styles.cardWrapper}>
          <View  style={styles.bgWrapper}/>
        </View>

        {this.props.stack ? this.renderStack() : this.renderCard()}


      </View>
    );
  }
}
