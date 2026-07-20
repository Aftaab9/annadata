import * as tf from '@tensorflow/tfjs'

const IMG_SIZE = 224

/**
 * Keras export includes backbone preprocess_input inside the graph.
 * Feed float32 RGB 0–255, 224×224 — same as Colab test_ds input.
 */
export function imageToInputTensor(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
): tf.Tensor4D {
  return tf.tidy(() => {
    const pixels = tf.browser.fromPixels(source)
    const resized = tf.image.resizeBilinear(pixels, [IMG_SIZE, IMG_SIZE])
    return resized.expandDims(0).cast('float32') as tf.Tensor4D
  })
}
