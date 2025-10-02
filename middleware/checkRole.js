export function restrictToRoles(...allowedRoles) {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            req.flash(
                "error_msg",
                "You must be logged in to perform this action."
            );
            return res.redirect("/login");
        }

        if (!allowedRoles.includes(user.role)) {
            req.flash(
                "error_msg",
                "You do not have permission to perform this action."
            );
            return res.redirect("/recipes"); // Or redirect to a 403 page
        }

        next();
    };
}
