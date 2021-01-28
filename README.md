# Serverless API Template

A serverless api template for use with API Gateway v2 HTTP APIs and ALB lambda integrations. In this particular setup, the ALB or API Gateway is instructed to route all paths to a single lambda, which then handles the routing. This spares one from the morass of mess that is writing API Gateway cloudformation.