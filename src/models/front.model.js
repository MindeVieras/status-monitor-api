
import { Database } from '../config/db'

let conn = new Database()

// Gets albums
export function getList(req, res){

  // console.log(req.app.get('user'));
  const { page, limit, media_limit } = req.body

  let l_page = parseInt(page) || 0
  let l_limit = parseInt(limit) || 5
  let l_media_limit = parseInt(media_limit) || 5

  let albums, media

  conn.query(`SELECT
                a.id, a.name,
                GROUP_CONCAT(m.id) AS media_ids
              FROM albums AS a
                LEFT JOIN media AS m ON a.id = m.entity_id
              GROUP BY a.id
              LIMIT ?, ?`, [l_page, l_limit])
    .then( rows => {
      albums = rows.map((a) => {
        let mediaArr = new Array()
        const { ...albumCopy } = a
        // Limit meida
        if (a.media_ids) {
          mediaArr = albumCopy.media_ids.split(',').slice(0, l_media_limit)
        }
        return {
          ...albumCopy,
          media_ids: mediaArr
        }
      })

      // Make media ids
      let mids = new Array()
      albums.map((a) => {
        a.media_ids.map((id) => {
          mids.push(id)
        })
      })
      // Get media
      return conn.query(`SELECT
                          m.*,
                          width.meta_value AS width,
                          height.meta_value AS height
                        FROM media AS m
                          LEFT JOIN media_meta AS width
                            ON m.id = width.media_id AND width.meta_name = 'width'
                          LEFT JOIN media_meta AS height
                            ON m.id = height.media_id AND height.meta_name = 'height'
                        WHERE m.id IN (?)`, [mids])

    })
    .then( (mediaRows) => {
      media = mediaRows.map((m) => {
        let mime, key
        mime = m.mime.includes('image') ? 'image' : 'video'
        if (mime === 'video') {
          key = require('../helpers/media').video(m.s3_key, 'medium')
        } else {
          key = require('../helpers/media').img(m.s3_key, 'thumb')
        }
        return {
          id: m.id,
          entity_id: m.entity_id,
          mime,
          key,
          width: parseInt(m.width),
          height: parseInt(m.height)
        }
      })
      // Assign media to album
      albums = albums.map((a) => {
        const { ...albumCopy } = a
        return {
          ...albumCopy,
          media: media.filter(m => albumCopy.id == m.entity_id)
        }
      })

      res.json({ack:'ok', msg: 'Albums list', data: albums})
    })
    .catch( err => {
      console.log(err)
      let msg = err.sqlMessage ? err.sqlMessage : err
      res.json({ack:'err', msg})
    })

}

