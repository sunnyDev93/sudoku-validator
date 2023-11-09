import { AnimationStyleMetadata, style } from "@angular/animations";

const none = style({});

const right = style({ transform: "translate3d(5px, 0, 0)" });
const left = style({ transform: "translate3d(-5px, 0, 0)" });

const far = style({ opacity: 0, transform: "scale3d(0, 0, 0)" });
const near = style({ opacity: 0.5, transform: "scale3d(.5, .5, .5)" });
const big = style({ opacity: 1, transform: "scale3d(1.5, 1.5, 1.5)" });

export const shakeTwoTimes: readonly AnimationStyleMetadata[] = [
	none,
	left,
	right,
	left,
	right,
	none,
];

export const shake: readonly AnimationStyleMetadata[] = [
	none,
	left,
	right,
	left,
	right,
	left,
	right,
	left,
	right,
	left,
	none,
];

export const zoomIn: readonly AnimationStyleMetadata[] = [far, none];

export const zoomInAndPulse: readonly AnimationStyleMetadata[] = [far, near, none, big, none];

export const zoomInAndPulseThreeTimes: readonly AnimationStyleMetadata[] = [
	far,
	near,
	none,
	big,
	none,
	big,
	none,
	big,
	none,
];

export const pulse: readonly AnimationStyleMetadata[] = [none, big, none];

export const pulseThreeTimes: readonly AnimationStyleMetadata[] = [
	none,
	big,
	none,
	big,
	none,
	big,
	none,
];
