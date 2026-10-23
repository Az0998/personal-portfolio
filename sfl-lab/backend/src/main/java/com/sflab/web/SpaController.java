package com.sflab.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.web.servlet.error.ErrorViewResolver;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.ModelAndView;

import java.util.Map;

@Component
public class SpaController implements ErrorViewResolver {
    @Override
    public ModelAndView resolveErrorView(HttpServletRequest request, HttpStatus status, Map<String, Object> model) {
        String path = request.getRequestURI();
        if (status == HttpStatus.NOT_FOUND && path != null && !path.startsWith("/api") && !path.startsWith("/h2")) {
            return new ModelAndView("forward:/index.html");
        }
        return null;
    }
}
