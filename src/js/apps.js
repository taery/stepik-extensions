/**
 * Created by meanmail on 22.02.17.
 */
;'use strict';

(function () {
    var widgets = window.widgets = {};
    var title = "Stepik Apps";

    var params = [];

    var parts = window.location.search.substr(1).split("&");

    for (var index in parts) {
        var pair = parts[index].split("=");
        params[pair[0]] = pair[1];
    }

    function loadWidget(name) {
        $.ajax({
            url: 'widgets/' + name + '/template.html',
            dataType: "html",
            success: function (data) {
                var widget = widgets[name] = {};
                widget.template = data;
                $("head").append("<link rel='stylesheet' type='text/css' href='widgets/" + name + "/css/template.css'>")
            }
        });
    }

    loadWidget("app");
    loadWidget("appheader");

    function Apps() {
    }

    $(document).ready(function () {
        $.ajax({
            url: 'apps/apps.json',
            dataType: "json",
            success: function (data) {
                window.apps = new Apps();
                apps.applications = data.applications;
                apps.categories = data.categories;

                initCategories();

                if (!!!params["app"]) {
                    drawApplications();
                } else {
                    loadApplication(params["app"]);
                }
            }
        });
    });

    function initCategories() {
        apps.categories.forEach(function (item) {
            $("#categories").append("<li><div class='category' category_id='" + item.id + "'>" + item.name + "</div></li>");
        });

        $(".category").click(function (event) {
            var id = event.currentTarget.getAttribute("category_id");
            drawApplications(id);
            event.stopPropagation()
        });
    }

    function drawApplications(category) {
        var content = $("#content");
        content.empty();
        category = parseInt(category);

        for (var appId in apps.applications) {
            var app = apps.applications[appId];

            if (!isNaN(category) && app.categories.indexOf(category) == -1) {
                continue;
            }

            content.append(processTemplate("${widget.app}", app));
        }

        $(".app").click(openApplication);
        $("title").text(title);
        updateUserName();
    }

    function openApplication(event) {
        var id = event.currentTarget.getAttribute("app_id");
        loadApplication(id);
        event.stopPropagation()
    }

    function loadApplication(id, redirect_app) {
        var content = $("#content");
        content.empty();

        var app = apps.applications[id];

        if (!!!app) {
            return;
        }

        if (app.need_authorization && $.cookie("access_token") == null) {
            loadApplication("login", app.id);
            return;
        }

        if (!!!app.content) {
            $.ajax({
                url: 'apps/' + app.id + '/content.html',
                dataType: "html",
                success: function (data) {
                    var head = $("head");
                    head.append("<link rel='stylesheet' type='text/css' href='apps/" + app.id + "/css/content.css'>");
                    head.append("<script src='apps/" + app.id + "/js/content.js'>");

                    app.content = data;
                    content.append(processTemplate("${widget.appheader} ${content}", app));
                    app.init(redirect_app);
                }
            });
        } else {
            content.append(processTemplate("${widget.appheader} ${content}", app));
            app.init(redirect_app);
        }

        $("title").text(title + " - " + app.name);
        updateUserName();
    }

    function updateUserName() {
        if ($.cookie("access_token") != null) {
            stepik.getCurrentUser().done(function (data) {
                var user = data.users[0];
                var first_name = user.first_name;
                var last_name = user.last_name;
                $("#user-name").text((first_name + " " + last_name).trim());
                $("#user-avatar").attr("src", user.avatar);
            });
        } else {
            $("#user-name").text("Didn't logged");
            $("#user-avatar").attr("src", "img/default_avatar.png");
        }
    }

    function processTemplate(template, map) {
        var fields;

        while ((fields = template.match(".*\\$\\{widget.([^${}]*)}.*")) != null) {
            var field = fields[1];
            var widget = widgets[field];
            var widget_template;

            if (!!widget) {
                widget_template = widget.template;
            } else {
                widget_template = "";
            }
            template = template.replace("${widget." + field + "}", widget_template);
        }

        while ((fields = template.match(".*\\$\\{([^${}]*)}.*")) != null) {
            field = fields[1];
            template = template.replace("${" + field + "}", map[field]);
        }

        return template;
    }
})();