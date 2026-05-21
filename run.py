from app import create_app

app = create_app()

if __name__ == "__main__":
    # Print routes
    with app.app_context():
        for rule in app.url_map.iter_rules():
            print(rule, rule.methods)

    # Run app
    app.run(debug=True)