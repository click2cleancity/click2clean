import Raw from 'react-slick'
import type SliderType from 'react-slick'

/**
 * react-slick's CJS build can surface as `{ default: Slider }` under ESM interop,
 * which makes `<Slider />` render an object and crash. Unwrap to the real class.
 */
const Slider: typeof SliderType =
  typeof Raw === 'function'
    ? (Raw as typeof SliderType)
    : (Raw as { default: typeof SliderType }).default

export default Slider
