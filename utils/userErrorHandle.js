exports.userError = (res, error, statusCode = 401) => {
    return res.status(statusCode).json({ error });
}

exports.handleNotFound = (req, res) => {
    this.userError(res, "Not Found", 404)
}
