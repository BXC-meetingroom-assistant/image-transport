const request = require('request')
const fs = require('fs')
const options = {
  'content-type': 'application/octet-stream',
  'accept-ranges': 'bytes',
}

const microsoftOptions = {
  url: 'https://westus.api.cognitive.microsoft.com/vision/v1.0/analyze?visualFeatures=Categories&language=en',
  headers: {
    'content-type': 'application/octet-stream',
    'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_VISION_API,
  }
}

const microsoftFaceAPI = {
  url: 'https://westus.api.cognitive.microsoft.com/face/v1.0/detect?returnFaceId=true&returnFaceLandmarks=false&returnFaceAttributes=smile',
  headers: {
    'content-type': 'application/octet-stream',
    'Ocp-Apim-Subscription-Key': process.env.MICROSOFT_FACE_API,
  }
}
const currentTimestamp = Date.now()
const imgName = `snap-${currentTimestamp}.jpg`
request
  .get('http://100.103.1.213/snap.jpg', options)
  .on('response', (response) => {
    microsoftFaceAPI.headers['content-length'] = response.headers['content-length']
  })
  .pipe(fs.createWriteStream(imgName))
  .on('finish', () => {
    console.log('done saving', imgName);
    return fs.createReadStream(imgName)
      .pipe(request.post(microsoftFaceAPI))
      .on('data', (rawData) => {
        var data = String(rawData)
        const honoPayload = {
          timestamp: currentTimestamp,
          count: JSON.parse(data).length
        }
        const honoRequestOptions = {
          uri: 'http://hono.bosch-iot-suite.com:8080/telemetry/bcx/meeting-room-assistant',
          method: 'PUT',
          headers: {
            'content-type': 'application/json'
          },
          json: true,
          body: honoPayload
        }
        return request(honoRequestOptions)
          .on('response', (response) => {
            console.log(response.headers);
          })
          .pipe(process.stdout)
      })
  })

