import * as tf from '@tensorflow/tfjs'

const IMG_SIZE = 224

/**
 * Keras leaf PlantVillage export expects float32 RGB **0–255**, 224×224.
 * Produce Quality uses `/255` inside produceInference.ts (Colab trained 0–1).
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
