const error = (err, req, res, next) => {
    console.log("got here from error handler", err);
    console.log("Simple Error", err.message);
    console.log("Stack Trace", err.stack);

    return res.status(500).json({
        error: "Internal Server Error"
    })
    
}


module.exports = error;