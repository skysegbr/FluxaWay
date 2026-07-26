import { h, useState } from "/dist/fluxaway.js";
import { Slider, RangeSlider } from "/dist/fluxaway-components-forms.js";

export const RANGE_ENTRIES = [
  {
    slug: "slider",
    name: "Slider",
    category: "forms",
    module: "fluxaway-components-forms.js",
    summary:
      "A single-value range input. Unlisted props go to the native <input type=\"range\">, so " +
      "you read the value from onInput's event like any other input.",
    demos: [
      {
        id: "slider-basic",
        title: "Value readout",
        stack: true,
        render: () => {
          const [volume, setVolume] = useState(35);

          return h(Slider, {
            label: "Volume",
            min: 0,
            max: 100,
            step: 5,
            value: volume,
            showValue: true,
            onInput: (event) => setVolume(Number(event.target.value)),
          });
        },
      },
    ],
    props: [
      { name: "min", type: "number", default: "0", description: "Lower bound." },
      { name: "max", type: "number", default: "100", description: "Upper bound." },
      { name: "step", type: "number", default: "1", description: "Granularity." },
      { name: "value", type: "number", description: "Controlled value." },
      {
        name: "showValue",
        type: "boolean",
        default: "false",
        description: "Prints the current value next to the label.",
      },
      { name: "onInput", type: "(event) => void", description: "Native input event while dragging." },
    ],
  },

  {
    slug: "range-slider",
    name: "RangeSlider",
    category: "forms",
    module: "fluxaway-components-forms.js",
    summary:
      "Two thumbs over one track for a min/max window. Unlike Slider, it owns its onChange and " +
      "hands you the [lower, upper] pair already ordered.",
    demos: [
      {
        id: "range-slider-basic",
        title: "Price window",
        stack: true,
        render: () => {
          const [range, setRange] = useState([20, 70]);

          return h(RangeSlider, {
            label: "Price range",
            min: 0,
            max: 100,
            step: 5,
            value: range,
            showValue: true,
            onChange: setRange,
            help: `From ${range[0]} to ${range[1]}`,
          });
        },
      },
    ],
    props: [
      {
        name: "value",
        type: "[number, number]",
        default: "[min, max]",
        description: "Current window, as [lower, upper].",
      },
      {
        name: "onChange",
        type: "(value: [number, number]) => void",
        description: "Receives the ordered pair — a thumb can never cross the other.",
      },
      { name: "min", type: "number", default: "0", description: "Lower bound." },
      { name: "max", type: "number", default: "100", description: "Upper bound." },
      {
        name: "minLabel",
        type: "string",
        default: '"Minimum"',
        description: "Accessible name of the lower thumb.",
      },
      {
        name: "maxLabel",
        type: "string",
        default: '"Maximum"',
        description: "Accessible name of the upper thumb.",
      },
    ],
  },
];
