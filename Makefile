build: 
	DOCKER_BUILDKIT=1 docker build --file Dockerfile --output dist .