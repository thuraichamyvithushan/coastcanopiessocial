const { getGridFSFileInfo, openGridFSDownloadStream } = require('../utils/gridfs');

exports.getMediaById = async (req, res) => {
    try {
        const file = await getGridFSFileInfo(req.params.id);

        if (!file) {
            return res.status(404).json({ message: 'Media file not found' });
        }

        if (file.contentType) {
            res.setHeader('Content-Type', file.contentType);
        }

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);

        const range = req.headers.range;
        let downloadStream;

        if (range) {
            const [startText, endText] = range.replace(/bytes=/, '').split('-');
            const start = Number.parseInt(startText, 10);
            const end = endText ? Number.parseInt(endText, 10) : file.length - 1;

            if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end >= file.length || start > end) {
                return res.status(416).set('Content-Range', `bytes */${file.length}`).end();
            }

            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${file.length}`);
            res.setHeader('Content-Length', end - start + 1);
            downloadStream = openGridFSDownloadStream(req.params.id, {
                start,
                end: end + 1
            });
        } else {
            res.setHeader('Content-Length', file.length);
            downloadStream = openGridFSDownloadStream(req.params.id);
        }
        downloadStream.on('error', (error) => {
            console.error('GridFS stream error:', error.message);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Failed to stream media file' });
            } else {
                res.end();
            }
        });

        downloadStream.pipe(res);
    } catch (error) {
        console.error('Media fetch error:', error.message);
        res.status(400).json({ message: 'Invalid media identifier' });
    }
};
